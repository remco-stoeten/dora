//! D1 schema introspection over HTTP.
//!
//! D1 is the SQLite dialect, so introspection uses the same `sqlite_master` /
//! `PRAGMA` queries the local SQLite reader uses (see
//! `crate::database::sqlite::schema`) — only the transport differs: each query
//! is a REST call via `D1Http` instead of a local `rusqlite` prepare. PRAGMAs
//! are sent as plain SQL (`PRAGMA table_info('users')`), which the D1 `/query`
//! endpoint accepts.

use std::collections::{HashMap, HashSet};

use serde_json::Value;

use crate::database::d1::{D1Http, D1Row};
use crate::database::types::{ColumnInfo, DatabaseSchema, ForeignKeyInfo, IndexInfo, TableInfo};
use crate::Error;

/// Reads a cell as a string, tolerating that D1 returns native JSON (a name may
/// arrive as a JSON string, a number as a JSON number, etc.).
fn cell_string(row: &D1Row, column: &str) -> Option<String> {
    match row.get(column)? {
        Value::String(s) => Some(s.clone()),
        Value::Null => None,
        other => Some(other.to_string()),
    }
}

/// Reads a cell as an integer (PRAGMA flags come back as JSON numbers).
fn cell_int(row: &D1Row, column: &str) -> i64 {
    match row.get(column) {
        Some(Value::Number(n)) => n.as_i64().unwrap_or(0),
        Some(Value::String(s)) => s.parse().unwrap_or(0),
        Some(Value::Bool(b)) => *b as i64,
        _ => 0,
    }
}

/// Runs a single statement and returns its rows (introspection statements never
/// take params).
async fn rows(http: &D1Http, sql: &str) -> Result<Vec<D1Row>, Error> {
    let result_sets = http.query(sql, Vec::new()).await?;
    Ok(result_sets
        .into_iter()
        .next()
        .map(|set| set.results)
        .unwrap_or_default())
}

/// Builds the full `DatabaseSchema` for a D1 database, mirroring the SQLite
/// reader's shape (tables, columns, primary keys, foreign keys, indexes, row
/// counts).
pub async fn get_database_schema(http: &D1Http) -> Result<DatabaseSchema, Error> {
    let table_rows = rows(
        http,
        "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'",
    )
    .await?;
    let table_names: Vec<String> = table_rows
        .iter()
        .filter_map(|row| cell_string(row, "name"))
        .collect();

    let mut tables = Vec::new();
    let mut unique_columns_set = HashSet::new();

    for table_name in table_names {
        // PRAGMA table_info: cid, name, type, notnull, dflt_value, pk
        let col_rows = rows(http, &format!("PRAGMA table_info('{table_name}')")).await?;

        // PRAGMA foreign_key_list: id, seq, table, from, to, on_update, on_delete, match
        let fk_rows = rows(http, &format!("PRAGMA foreign_key_list('{table_name}')")).await?;
        let fk_map: HashMap<String, ForeignKeyInfo> = fk_rows
            .iter()
            .filter_map(|row| {
                let from = cell_string(row, "from")?;
                let ref_table = cell_string(row, "table")?;
                let ref_column = cell_string(row, "to")?;
                Some((
                    from,
                    ForeignKeyInfo {
                        referenced_table: ref_table,
                        referenced_column: ref_column,
                        referenced_schema: String::new(),
                    },
                ))
            })
            .collect();

        // Row-count estimate. A failed count (e.g. large table cap) is non-fatal.
        let row_count = rows(http, &format!("SELECT COUNT(*) AS c FROM \"{table_name}\""))
            .await
            .ok()
            .and_then(|count_rows| count_rows.first().map(|row| cell_int(row, "c") as u64));

        // Indexes: index_list (seq, name, unique, origin, partial) → index_info.
        let mut indexes = Vec::new();
        let index_rows = rows(http, &format!("PRAGMA index_list('{table_name}')")).await?;
        for index_row in &index_rows {
            let Some(name) = cell_string(index_row, "name") else {
                continue;
            };
            let is_unique = cell_int(index_row, "unique") != 0;
            let info_rows = rows(http, &format!("PRAGMA index_info('{name}')")).await?;
            let column_names: Vec<String> = info_rows
                .iter()
                .filter_map(|row| cell_string(row, "name"))
                .collect();
            indexes.push(IndexInfo {
                name,
                column_names,
                is_unique,
                is_primary: false,
            });
        }

        // AUTOINCREMENT only applies to INTEGER PRIMARY KEY; detect it from the
        // table's CREATE SQL, like the SQLite reader.
        let create_sql = rows(
            http,
            &format!("SELECT sql FROM sqlite_master WHERE type='table' AND name='{table_name}'"),
        )
        .await?
        .first()
        .and_then(|row| cell_string(row, "sql"))
        .unwrap_or_default();
        let has_autoincrement = create_sql.to_uppercase().contains("AUTOINCREMENT");

        let mut columns = Vec::new();
        let mut primary_key_columns = Vec::new();

        for col_row in &col_rows {
            let Some(column_name) = cell_string(col_row, "name") else {
                continue;
            };
            let data_type = cell_string(col_row, "type").unwrap_or_default();
            let is_nullable = cell_int(col_row, "notnull") == 0;
            let default_value = cell_string(col_row, "dflt_value");
            let is_primary_key = cell_int(col_row, "pk") > 0;

            unique_columns_set.insert(column_name.clone());
            if is_primary_key {
                primary_key_columns.push(column_name.clone());
            }
            let is_auto_increment = is_primary_key
                && data_type.to_uppercase() == "INTEGER"
                && (has_autoincrement || primary_key_columns.len() == 1);
            let foreign_key = fk_map.get(&column_name).cloned();

            columns.push(ColumnInfo {
                name: column_name,
                data_type,
                is_nullable,
                default_value,
                is_primary_key,
                is_auto_increment,
                foreign_key,
                allowed_values: None,
            });
        }

        tables.push(TableInfo {
            name: table_name,
            schema: String::new(),
            columns,
            primary_key_columns,
            row_count_estimate: row_count,
            indexes,
        });
    }

    Ok(DatabaseSchema {
        tables,
        schemas: vec![],
        unique_columns: unique_columns_set.into_iter().collect(),
    })
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::database::d1::D1ResultSet;

    fn result_set(json: &str) -> D1ResultSet {
        serde_json::from_str(json).expect("result set should deserialize")
    }

    #[test]
    fn reads_table_info_row_fields() {
        // A PRAGMA table_info row, as D1 returns it (object keyed by column).
        let set = result_set(
            r#"{ "results": [
                { "cid": 0, "name": "id", "type": "INTEGER", "notnull": 1, "dflt_value": null, "pk": 1 },
                { "cid": 1, "name": "email", "type": "TEXT", "notnull": 0, "dflt_value": null, "pk": 0 }
            ], "meta": {} }"#,
        );
        let id = &set.results[0];
        assert_eq!(cell_string(id, "name").as_deref(), Some("id"));
        assert_eq!(cell_string(id, "type").as_deref(), Some("INTEGER"));
        assert_eq!(cell_int(id, "notnull"), 1);
        assert_eq!(cell_int(id, "pk"), 1);

        let email = &set.results[1];
        assert_eq!(cell_int(email, "notnull"), 0);
        assert_eq!(cell_int(email, "pk"), 0);
        assert!(cell_string(email, "dflt_value").is_none());
    }

    #[test]
    fn reads_foreign_key_list_fields() {
        let set = result_set(
            r#"{ "results": [
                { "id": 0, "seq": 0, "table": "users", "from": "user_id", "to": "id" }
            ], "meta": {} }"#,
        );
        let row = &set.results[0];
        assert_eq!(cell_string(row, "from").as_deref(), Some("user_id"));
        assert_eq!(cell_string(row, "table").as_deref(), Some("users"));
        assert_eq!(cell_string(row, "to").as_deref(), Some("id"));
    }

    #[test]
    fn cell_int_tolerates_string_and_bool() {
        let set = result_set(
            r#"{ "results": [ { "a": "5", "b": true, "c": 9 } ], "meta": {} }"#,
        );
        let row = &set.results[0];
        assert_eq!(cell_int(row, "a"), 5);
        assert_eq!(cell_int(row, "b"), 1);
        assert_eq!(cell_int(row, "c"), 9);
    }
}
