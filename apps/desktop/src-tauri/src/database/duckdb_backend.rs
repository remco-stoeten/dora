//! Process-agnostic handle to a single DuckDB connection.
//!
//! Today the only implementation runs DuckDB in-process. The helper-process
//! work (see `docs/duckdb-helper-process.md`) adds an IPC implementation so the
//! main binary no longer links the DuckDB engine — it is downloaded on first
//! use and driven through a small sidecar.
//!
//! Every method takes and returns serde-serialisable types so the exact same
//! surface works unchanged over a pipe. This mirrors the existing
//! `DatabaseAdapter` (read), `WriteAdapter`, and `WatchAdapter` surfaces plus
//! the DuckDB-only operations (counts, file-source registration, import,
//! session materialisation, and the two ad-hoc raw queries).

use std::sync::Arc;

use async_trait::async_trait;

use crate::{
    database::{
        duckdb::{
            file_source::DataFileSourceEntry, import_files::ImportFilesIntoDuckDbResult,
            save_session::SaveDataFileSessionResult,
        },
        maintenance::{DumpResult, SoftDeleteResult, TruncateResult},
        parser::ParsedStatement,
        services::mutation::MutationResult,
        types::{DatabaseSchema, ExecSender},
    },
    Error,
};

/// Shared handle to one DuckDB connection. Cheap to clone (`Arc`).
pub type BoxedDuckDbConn = Arc<dyn DuckDbConn>;

/// One DuckDB connection's full operation surface, independent of whether the
/// engine runs in this process or in the helper.
#[async_trait]
pub trait DuckDbConn: Send + Sync {
    // ---- read / query ----

    /// Run a parsed statement, streaming `QueryExecEvent`s (TypesResolved →
    /// Page(s of 50) → Finished) through `sender`. Mirrors
    /// `DatabaseAdapter::execute_query`.
    async fn execute_query(&self, stmt: ParsedStatement, sender: &ExecSender)
        -> Result<(), Error>;

    /// Full schema introspection (tables, columns, indexes, foreign keys,
    /// views). Mirrors `DatabaseAdapter::get_schema`.
    async fn get_schema(&self) -> Result<DatabaseSchema, Error>;

    /// Whether the underlying connection is live.
    fn is_connected(&self) -> bool;

    /// Column names + JSON rows for ad-hoc internal callers that bypass the
    /// streaming page protocol (`fetch_duckdb_data`, seeding previews).
    async fn query_raw(
        &self,
        sql: String,
    ) -> Result<(Vec<String>, Vec<Vec<serde_json::Value>>), Error>;

    /// Parameterless statement execution returning the affected row count
    /// (seeding inserts).
    async fn execute_raw(&self, sql: String) -> Result<usize, Error>;

    // ---- write (mirrors WriteAdapter) ----

    async fn insert_row(
        &self,
        table: String,
        schema: Option<String>,
        row_data: serde_json::Map<String, serde_json::Value>,
    ) -> Result<MutationResult, Error>;

    async fn update_cell(
        &self,
        table: String,
        schema: Option<String>,
        pk_column: String,
        pk_value: serde_json::Value,
        column: String,
        new_value: serde_json::Value,
    ) -> Result<MutationResult, Error>;

    async fn delete_rows(
        &self,
        table: String,
        schema: Option<String>,
        pk_column: String,
        pk_values: Vec<serde_json::Value>,
    ) -> Result<MutationResult, Error>;

    async fn duplicate_row(
        &self,
        table: String,
        schema: Option<String>,
        pk_column: String,
        pk_value: serde_json::Value,
    ) -> Result<MutationResult, Error>;

    async fn truncate_table(
        &self,
        table: String,
        schema: Option<String>,
        cascade: Option<bool>,
    ) -> Result<TruncateResult, Error>;

    async fn truncate_database(
        &self,
        schema: Option<String>,
        confirm: bool,
    ) -> Result<TruncateResult, Error>;

    async fn soft_delete_rows(
        &self,
        table: String,
        schema: Option<String>,
        pk_column: String,
        pk_values: Vec<serde_json::Value>,
        soft_delete_column: Option<String>,
    ) -> Result<SoftDeleteResult, Error>;

    async fn undo_soft_delete(
        &self,
        table: String,
        schema: Option<String>,
        pk_column: String,
        pk_values: Vec<serde_json::Value>,
        soft_delete_column: String,
    ) -> Result<MutationResult, Error>;

    async fn dump_database(&self, output_path: String) -> Result<DumpResult, Error>;

    async fn execute_batch(&self, statements: Vec<String>) -> Result<MutationResult, Error>;

    async fn get_blob_bytes(
        &self,
        table: String,
        schema: Option<String>,
        pk_column: String,
        pk_value: serde_json::Value,
        column: String,
    ) -> Result<Vec<u8>, Error>;

    // ---- watch ----

    /// Stable hash of a table's rows for live-monitor change detection. Mirrors
    /// `WatchAdapter::poll_table_hash` with owned args (pipe-friendly).
    async fn poll_table_hash(
        &self,
        table: String,
        schema: Option<String>,
    ) -> Result<u64, Error>;

    // ---- metadata ----

    /// Table count + estimated row count (`duckdb_tables()`).
    async fn get_counts(&self) -> Result<(u32, u64), Error>;

    // ---- data-file sources / import / save ----

    /// Register CSV/Parquet/JSON files as read-only views, reporting per-source
    /// status.
    async fn register_sources(
        &self,
        sources: Vec<String>,
    ) -> Result<Vec<DataFileSourceEntry>, Error>;

    /// Import files into physical `main` tables.
    async fn import_files(
        &self,
        file_paths: Vec<String>,
    ) -> Result<ImportFilesIntoDuckDbResult, Error>;

    /// Materialise the active data-file views into a destination `.duckdb` file.
    async fn materialize_data_file_session(
        &self,
        entries: Vec<DataFileSourceEntry>,
        destination_path: String,
        overwrite: bool,
    ) -> Result<SaveDataFileSessionResult, Error>;
}
