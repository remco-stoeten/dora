use sqlparser::{ast::Statement, dialect::DuckDbDialect};

use crate::database::{
    self,
    parser::{ParsedStatement, SqlDialectExt},
};

pub fn parse_statements(query: &str) -> anyhow::Result<Vec<ParsedStatement>> {
    database::parser::parse_statements(&DuckDbDialect {}, query)
}

impl SqlDialectExt for DuckDbDialect {
    fn returns_values(stmt: &Statement) -> bool {
        match stmt {
            Statement::Query(_) => true,
            Statement::Insert(insert) if insert.returning.is_some() => true,
            Statement::Update { returning, .. } if returning.is_some() => true,
            Statement::Delete(delete) if delete.returning.is_some() => true,
            Statement::Explain { .. } => true,
            Statement::ExplainTable { .. } => true,
            Statement::ShowTables { .. }
            | Statement::ShowColumns { .. }
            | Statement::ShowDatabases { .. }
            | Statement::ShowSchemas { .. }
            | Statement::ShowVariable { .. } => true,
            _ => false,
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn parses_statements() {
        let results = parse_statements("SELECT * FROM users").unwrap();
        assert_eq!(results.len(), 1);
        assert!(results[0].returns_values);

        let multi_query = r#"
            CREATE TABLE t (id INTEGER PRIMARY KEY, name TEXT);
            INSERT INTO t (name) VALUES ('Alice') RETURNING id;
            UPDATE t SET name = 'Bob' WHERE id = 1;
            SELECT * FROM t;
            DROP TABLE t;
        "#;

        let results = parse_statements(multi_query).unwrap();
        assert_eq!(results.len(), 5);
        assert!(!results[0].returns_values);
        assert!(results[1].returns_values, "INSERT .. RETURNING");
        assert!(!results[2].returns_values);
        assert!(results[3].returns_values);
        assert!(!results[4].returns_values);
    }

    #[test]
    fn classifies_read_only() {
        let results = parse_statements("SELECT 1; DELETE FROM t; EXPLAIN SELECT 1").unwrap();
        assert!(results[0].is_read_only);
        assert!(!results[1].is_read_only);
        assert!(results[2].is_read_only);
    }
}
