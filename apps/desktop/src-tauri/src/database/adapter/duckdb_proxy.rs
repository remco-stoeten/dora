//! Adapter façade over an `Arc<dyn DuckDbConn>`.
//!
//! The dispatch functions (`adapter_from_client`, `write_adapter_from_client`,
//! `watch_adapter_from_client`) build this so the rest of the app keeps using
//! the Read/Write/Watch adapter traits unchanged while DuckDB runs in-process
//! (today) or in the helper process (phase 2), transparently. Every method
//! forwards to the `DuckDbConn` handle.

use std::sync::Arc;

use async_trait::async_trait;

use crate::{
    database::{
        adapter::{read::DatabaseAdapter, watch::WatchAdapter, write::WriteAdapter, DatabaseType},
        duckdb_backend::DuckDbConn,
        maintenance::{DumpResult, SoftDeleteResult, TruncateResult},
        parser::ParsedStatement,
        services::mutation::MutationResult,
        types::{DatabaseSchema, ExecSender},
    },
    Error,
};

pub struct DuckDbConnAdapter {
    conn: Arc<dyn DuckDbConn>,
}

impl DuckDbConnAdapter {
    pub fn new(conn: Arc<dyn DuckDbConn>) -> Self {
        Self { conn }
    }
}

#[async_trait]
impl DatabaseAdapter for DuckDbConnAdapter {
    fn parse_statements(&self, query: &str) -> Result<Vec<ParsedStatement>, Error> {
        crate::database::duckdb::parser::parse_statements(query).map_err(Into::into)
    }

    async fn execute_query(&self, stmt: ParsedStatement, sender: &ExecSender) -> Result<(), Error> {
        self.conn.execute_query(stmt, sender).await
    }

    async fn get_schema(&self) -> Result<DatabaseSchema, Error> {
        self.conn.get_schema().await
    }

    fn is_connected(&self) -> bool {
        self.conn.is_connected()
    }

    fn database_type(&self) -> DatabaseType {
        DatabaseType::DuckDB
    }
}

#[async_trait]
impl WriteAdapter for DuckDbConnAdapter {
    async fn insert_row(
        &self,
        table: String,
        schema: Option<String>,
        row_data: serde_json::Map<String, serde_json::Value>,
    ) -> Result<MutationResult, Error> {
        self.conn.insert_row(table, schema, row_data).await
    }

    async fn update_cell(
        &self,
        table: String,
        schema: Option<String>,
        pk_column: String,
        pk_value: serde_json::Value,
        column: String,
        new_value: serde_json::Value,
    ) -> Result<MutationResult, Error> {
        self.conn
            .update_cell(table, schema, pk_column, pk_value, column, new_value)
            .await
    }

    async fn delete_rows(
        &self,
        table: String,
        schema: Option<String>,
        pk_column: String,
        pk_values: Vec<serde_json::Value>,
    ) -> Result<MutationResult, Error> {
        self.conn
            .delete_rows(table, schema, pk_column, pk_values)
            .await
    }

    async fn duplicate_row(
        &self,
        table: String,
        schema: Option<String>,
        pk_column: String,
        pk_value: serde_json::Value,
    ) -> Result<MutationResult, Error> {
        self.conn
            .duplicate_row(table, schema, pk_column, pk_value)
            .await
    }

    async fn truncate_table(
        &self,
        table: String,
        schema: Option<String>,
        cascade: Option<bool>,
    ) -> Result<TruncateResult, Error> {
        self.conn.truncate_table(table, schema, cascade).await
    }

    async fn truncate_database(
        &self,
        schema: Option<String>,
        confirm: bool,
    ) -> Result<TruncateResult, Error> {
        self.conn.truncate_database(schema, confirm).await
    }

    async fn soft_delete_rows(
        &self,
        table: String,
        schema: Option<String>,
        pk_column: String,
        pk_values: Vec<serde_json::Value>,
        soft_delete_column: Option<String>,
    ) -> Result<SoftDeleteResult, Error> {
        self.conn
            .soft_delete_rows(table, schema, pk_column, pk_values, soft_delete_column)
            .await
    }

    async fn undo_soft_delete(
        &self,
        table: String,
        schema: Option<String>,
        pk_column: String,
        pk_values: Vec<serde_json::Value>,
        soft_delete_column: String,
    ) -> Result<MutationResult, Error> {
        self.conn
            .undo_soft_delete(table, schema, pk_column, pk_values, soft_delete_column)
            .await
    }

    async fn dump_database(&self, output_path: String) -> Result<DumpResult, Error> {
        self.conn.dump_database(output_path).await
    }

    async fn execute_batch(&self, statements: Vec<String>) -> Result<MutationResult, Error> {
        self.conn.execute_batch(statements).await
    }

    async fn get_blob_bytes(
        &self,
        table: String,
        schema: Option<String>,
        pk_column: String,
        pk_value: serde_json::Value,
        column: String,
    ) -> Result<Vec<u8>, Error> {
        self.conn
            .get_blob_bytes(table, schema, pk_column, pk_value, column)
            .await
    }
}

#[async_trait]
impl WatchAdapter for DuckDbConnAdapter {
    async fn poll_table_hash(&self, table: &str, schema: Option<&str>) -> Result<u64, Error> {
        self.conn
            .poll_table_hash(table.to_string(), schema.map(str::to_string))
            .await
    }
}
