//! Out-of-process DuckDB helper.
//!
//! Long-lived sidecar spawned by the main app on first DuckDB use. It owns the
//! real `duckdb::Connection`s and serves framed requests over stdin/stdout (see
//! `app_lib::database::duckdb_ipc`). Linking the engine here — rather than in
//! the main binary — is what lets the default download shrink once phase 4b
//! moves this into its own crate.

#[tokio::main]
async fn main() {
    app_lib::database::duckdb_ipc::helper::run().await;
}
