//! Wire protocol shared by the main app and the DuckDB helper process.
//!
//! Everything here is serde-serialisable and carries no `duckdb` dependency, so
//! the same module compiles into both the main binary (which never links the
//! engine once phase 4b lands) and the helper crate. Framing is length-prefixed
//! JSON: a big-endian `u32` byte length followed by that many bytes of JSON.
//! Each request carries a monotonically increasing `id`; responses echo it so
//! concurrent requests multiplex over the single stdin/stdout pipe.

use serde::{Deserialize, Serialize};
use serde_json::value::RawValue;

use crate::{
    database::{
        duckdb::{
            file_source::DataFileSourceEntry, import_files::ImportFilesIntoDuckDbResult,
            save_session::SaveDataFileSessionResult,
        },
        maintenance::{DumpResult, SoftDeleteResult, TruncateResult},
        parser::ParsedStatement,
        services::mutation::MutationResult,
        types::DatabaseSchema,
    },
    Error,
};

/// Opaque handle the helper maps to a real `duckdb::Connection`.
pub type ConnId = u64;

/// One request from the main app to the helper. Per-connection variants carry
/// the `conn_id`; `Open` allocates one. The variant set mirrors the
/// `DuckDbConn` trait method-for-method (plus `Open`/`Close` lifecycle).
#[derive(Debug, Serialize, Deserialize)]
pub enum Request {
    Open {
        db_path: String,
        file_sources: Vec<String>,
    },
    Close {
        conn_id: ConnId,
    },
    ExecuteQuery {
        conn_id: ConnId,
        stmt: ParsedStatement,
    },
    GetSchema {
        conn_id: ConnId,
    },
    IsConnected {
        conn_id: ConnId,
    },
    QueryRaw {
        conn_id: ConnId,
        sql: String,
    },
    ExecRaw {
        conn_id: ConnId,
        sql: String,
    },
    InsertRow {
        conn_id: ConnId,
        table: String,
        schema: Option<String>,
        row_data: serde_json::Map<String, serde_json::Value>,
    },
    UpdateCell {
        conn_id: ConnId,
        table: String,
        schema: Option<String>,
        pk_column: String,
        pk_value: serde_json::Value,
        column: String,
        new_value: serde_json::Value,
    },
    DeleteRows {
        conn_id: ConnId,
        table: String,
        schema: Option<String>,
        pk_column: String,
        pk_values: Vec<serde_json::Value>,
    },
    DuplicateRow {
        conn_id: ConnId,
        table: String,
        schema: Option<String>,
        pk_column: String,
        pk_value: serde_json::Value,
    },
    TruncateTable {
        conn_id: ConnId,
        table: String,
        schema: Option<String>,
        cascade: Option<bool>,
    },
    TruncateDatabase {
        conn_id: ConnId,
        schema: Option<String>,
        confirm: bool,
    },
    SoftDeleteRows {
        conn_id: ConnId,
        table: String,
        schema: Option<String>,
        pk_column: String,
        pk_values: Vec<serde_json::Value>,
        soft_delete_column: Option<String>,
    },
    UndoSoftDelete {
        conn_id: ConnId,
        table: String,
        schema: Option<String>,
        pk_column: String,
        pk_values: Vec<serde_json::Value>,
        soft_delete_column: String,
    },
    DumpDatabase {
        conn_id: ConnId,
        output_path: String,
    },
    ExecuteBatch {
        conn_id: ConnId,
        statements: Vec<String>,
    },
    GetBlobBytes {
        conn_id: ConnId,
        table: String,
        schema: Option<String>,
        pk_column: String,
        pk_value: serde_json::Value,
        column: String,
    },
    PollTableHash {
        conn_id: ConnId,
        table: String,
        schema: Option<String>,
    },
    GetCounts {
        conn_id: ConnId,
    },
    RegisterSources {
        conn_id: ConnId,
        sources: Vec<String>,
    },
    ImportFiles {
        conn_id: ConnId,
        file_paths: Vec<String>,
    },
    MaterializeDataFileSession {
        conn_id: ConnId,
        entries: Vec<DataFileSourceEntry>,
        destination_path: String,
        overwrite: bool,
    },
}

/// A successful response payload. The variant returned is determined by the
/// request; callers know which to expect and treat a mismatch as a protocol
/// error.
#[derive(Debug, Serialize, Deserialize)]
pub enum RespPayload {
    Unit,
    Opened {
        conn_id: ConnId,
        entries: Vec<DataFileSourceEntry>,
    },
    Bool(bool),
    Mutation(MutationResult),
    Truncate(TruncateResult),
    SoftDelete(SoftDeleteResult),
    Dump(DumpResult),
    Schema(DatabaseSchema),
    QueryRaw {
        columns: Vec<String>,
        rows: Vec<Vec<serde_json::Value>>,
    },
    ExecRaw {
        affected: usize,
    },
    Hash(u64),
    Counts {
        tables: u32,
        rows: u64,
    },
    Sources(Vec<DataFileSourceEntry>),
    Import(ImportFilesIntoDuckDbResult),
    Materialize(SaveDataFileSessionResult),
    Blob(Vec<u8>),
}

/// Serde-able mirror of [`crate::database::types::QueryExecEvent`]. Streamed for
/// `ExecuteQuery` ahead of the terminal `Done` frame.
#[derive(Debug, Serialize, Deserialize)]
pub enum StreamEvent {
    TypesResolved {
        columns: Box<RawValue>,
    },
    Page {
        page_amount: usize,
        page: Box<RawValue>,
    },
    Finished {
        elapsed_ms: u64,
        affected_rows: usize,
        error: Option<String>,
    },
}

/// One frame from the helper back to the main app, tagged with the originating
/// request `id`. `ExecuteQuery` emits zero or more `Event`s followed by exactly
/// one `Done`; every other request emits a single `Done`.
#[derive(Debug, Serialize, Deserialize)]
pub struct ResponseFrame {
    pub id: u64,
    pub msg: ResponseMsg,
}

#[derive(Debug, Serialize, Deserialize)]
pub enum ResponseMsg {
    Event(StreamEvent),
    Done(Result<RespPayload, WireError>),
}

#[derive(Debug, Serialize, Deserialize)]
pub struct RequestFrame {
    pub id: u64,
    pub req: Request,
}

/// Errors cross the pipe as a string + best-effort kind tag. The main app
/// reconstitutes them into [`Error`]; full structural fidelity is unnecessary
/// because the frontend only sees the serialized `{kind, detail}` shape anyway.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WireError {
    pub message: String,
}

impl From<&Error> for WireError {
    fn from(e: &Error) -> Self {
        WireError {
            message: e.to_string(),
        }
    }
}

impl From<Error> for WireError {
    fn from(e: Error) -> Self {
        WireError::from(&e)
    }
}

impl From<WireError> for Error {
    fn from(e: WireError) -> Self {
        Error::Internal(e.message)
    }
}

/// Maximum frame payload we will allocate for, guarding against a corrupt
/// length prefix. DuckDB result pages are bounded (50 rows) and other payloads
/// are small, so 256 MiB is comfortably generous.
pub const MAX_FRAME_LEN: u32 = 256 * 1024 * 1024;
