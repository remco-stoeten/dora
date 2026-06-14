use anyhow::{anyhow, Context};
use dashmap::DashMap;
use std::sync::Arc;
use uuid::Uuid;

use crate::{
    database::{
        metadata::{self, DatabaseMetadata},
        postgres, sqlite,
        types::{Database, DatabaseConnection, DatabaseSchema},
    },
    error::Error,
};

pub struct MetadataService<'a> {
    pub connections: &'a DashMap<Uuid, DatabaseConnection>,
    pub schemas: &'a DashMap<Uuid, Arc<DatabaseSchema>>,
}

impl<'a> MetadataService<'a> {
    pub async fn get_database_schema(
        &self,
        connection_id: Uuid,
    ) -> Result<Arc<DatabaseSchema>, Error> {
        if let Some(schema) = self.schemas.get(&connection_id) {
            return Ok(schema.clone());
        }

        let connection_entry = self
            .connections
            .get(&connection_id)
            .with_context(|| format!("Connection not found: {}", connection_id))?;

        let connection = connection_entry.value();

        let schema = match &connection.database {
            // TODO(dialect-parity, #89): CockroachDB shares the Postgres
            // introspection path. Some Postgres catalog queries differ on
            // CockroachDB; branch here on `connection.detected_dialect` once a
            // live CockroachDB cluster is available to verify a Cockroach-specific
            // query. Until then the vanilla Postgres query is the safe default.
            Database::CockroachDB {
                client: Some(client),
                ..
            }
            | Database::Postgres {
                client: Some(client),
                ..
            } => postgres::schema::get_database_schema(client).await?,
            Database::CockroachDB { client: None, .. } => {
                return Err(Error::Any(anyhow!("CockroachDB connection not active")))
            }
            Database::Postgres { client: None, .. } => {
                return Err(Error::Any(anyhow!("Postgres connection not active")))
            }
            Database::SQLite {
                connection: Some(conn),
                ..
            } => sqlite::schema::get_database_schema(Arc::clone(conn)).await?,
            Database::SQLite {
                connection: None, ..
            } => return Err(Error::Any(anyhow!("SQLite connection not active"))),
            Database::DuckDB {
                connection: Some(conn),
                ..
            } => crate::database::duckdb::schema::get_database_schema(Arc::clone(conn)).await?,
            Database::DuckDB {
                connection: None, ..
            } => return Err(Error::Any(anyhow!("DuckDB connection not active"))),
            Database::LibSQL {
                connection: Some(conn),
                ..
            } => crate::database::libsql::schema::get_database_schema(Arc::clone(conn)).await?,
            Database::LibSQL {
                connection: None, ..
            } => return Err(Error::Any(anyhow!("LibSQL connection not active"))),
            // TODO(dialect-parity, #88): MariaDB shares the MySQL introspection
            // path. MariaDB-specific types (UUID, INET4/INET6) and some
            // information_schema differences need a dialect branch on
            // `connection.detected_dialect`, plus row-writer type mapping in the
            // write path. Deferred until a live MariaDB cluster is available; the
            // vanilla MySQL query remains the safe default.
            Database::MariaDB {
                pool: Some(pool), ..
            }
            | Database::MySQL {
                pool: Some(pool), ..
            } => crate::database::mysql::schema::get_database_schema(pool.clone()).await?,
            Database::MariaDB { pool: None, .. } => {
                return Err(Error::Any(anyhow!("MariaDB connection not active")))
            }
            Database::MySQL { pool: None, .. } => {
                return Err(Error::Any(anyhow!("MySQL connection not active")))
            }
        };

        let schema = Arc::new(schema);
        self.schemas.insert(connection_id, schema.clone());

        Ok(schema)
    }

    pub async fn get_database_metadata(
        &self,
        connection_id: Uuid,
    ) -> Result<DatabaseMetadata, Error> {
        let connection_entry = self
            .connections
            .get(&connection_id)
            .with_context(|| format!("Connection not found: {}", connection_id))?;

        let connection = connection_entry.value();

        match &connection.database {
            Database::CockroachDB {
                connection_string,
                client: Some(client),
                ..
            }
            | Database::Postgres {
                connection_string,
                client: Some(client),
                ..
            } => metadata::get_postgres_metadata(client, connection_string).await,
            Database::CockroachDB { client: None, .. } => {
                Err(Error::Any(anyhow!("CockroachDB connection not active")))
            }
            Database::Postgres { client: None, .. } => {
                Err(Error::Any(anyhow!("Postgres connection not active")))
            }
            Database::SQLite {
                db_path,
                connection: Some(conn),
            } => {
                let mut meta = metadata::get_sqlite_metadata(db_path)?;
                let conn_guard = conn
                    .lock()
                    .map_err(|_| Error::Internal("Mutex poisoned".into()))?;
                let (table_count, row_count) = metadata::get_sqlite_counts(&conn_guard)?;
                meta.table_count = table_count;
                meta.row_count_total = row_count;
                Ok(meta)
            }
            Database::SQLite {
                connection: None, ..
            } => Err(Error::Any(anyhow!("SQLite connection not active"))),
            Database::DuckDB {
                db_path,
                connection: Some(conn),
                ..
            } => {
                // File-stat based metadata works for any file-backed database
                let mut meta = metadata::get_sqlite_metadata(db_path)?;
                let conn_guard = conn
                    .lock()
                    .map_err(|_| Error::Internal("Mutex poisoned".into()))?;
                let (table_count, row_count) = metadata::get_duckdb_counts(&conn_guard)?;
                meta.table_count = table_count;
                meta.row_count_total = row_count;
                Ok(meta)
            }
            Database::DuckDB {
                connection: None, ..
            } => Err(Error::Any(anyhow!("DuckDB connection not active"))),
            Database::LibSQL {
                url,
                connection: Some(conn),
                ..
            } => metadata::get_libsql_metadata(conn, url).await,
            Database::LibSQL {
                connection: None, ..
            } => Err(Error::Any(anyhow!("LibSQL connection not active"))),
            Database::MariaDB {
                connection_string,
                pool: Some(pool),
                ..
            }
            | Database::MySQL {
                connection_string,
                pool: Some(pool),
                ..
            } => metadata::get_mysql_metadata(pool, connection_string).await,
            Database::MariaDB { pool: None, .. } => {
                Err(Error::Any(anyhow!("MariaDB connection not active")))
            }
            Database::MySQL { pool: None, .. } => {
                Err(Error::Any(anyhow!("MySQL connection not active")))
            }
        }
    }
}
