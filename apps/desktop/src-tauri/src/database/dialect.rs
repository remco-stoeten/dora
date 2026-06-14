//! Runtime SQL dialect detection and source capability gating.
//!
//! Dora routes CockroachDB through the Postgres wire protocol and MariaDB
//! through the MySQL wire protocol. The two engines are wire-compatible but
//! differ in features (e.g. CockroachDB has no `LISTEN`/`NOTIFY`). At connect
//! time we run a `version()` query and detect the *true* engine so that the
//! rest of the app can branch where it matters.
//!
//! The detection functions here are intentionally pure (string -> enum) so they
//! can be unit-tested without a live database. Everything that needs a live
//! cluster (schema introspection, type mapping) is explicitly deferred — see
//! the `TODO(dialect-parity)` markers.

use serde::Serialize;
use specta::Type;

/// Concrete engine behind a Postgres-wire connection.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Type)]
#[serde(rename_all = "snake_case")]
pub enum PgDialect {
    /// Vanilla PostgreSQL (the default / safe path).
    Postgres,
    /// CockroachDB speaking the Postgres wire protocol.
    CockroachDb,
}

/// Concrete engine behind a MySQL-wire connection.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Type)]
#[serde(rename_all = "snake_case")]
pub enum MySqlDialect {
    /// Vanilla MySQL (the default / safe path).
    MySql,
    /// MariaDB speaking the MySQL wire protocol.
    MariaDb,
}

/// A unified, runtime-detected dialect tag stored on a connection.
///
/// `None` of these is fabricated: each is set only after a successful
/// `version()` query against the live server.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Type)]
#[serde(rename_all = "snake_case")]
pub enum DetectedDialect {
    Postgres,
    CockroachDb,
    MySql,
    MariaDb,
}

impl From<PgDialect> for DetectedDialect {
    fn from(value: PgDialect) -> Self {
        match value {
            PgDialect::Postgres => DetectedDialect::Postgres,
            PgDialect::CockroachDb => DetectedDialect::CockroachDb,
        }
    }
}

impl From<MySqlDialect> for DetectedDialect {
    fn from(value: MySqlDialect) -> Self {
        match value {
            MySqlDialect::MySql => DetectedDialect::MySql,
            MySqlDialect::MariaDb => DetectedDialect::MariaDb,
        }
    }
}

/// Detect the real engine from a Postgres `SELECT version()` string.
///
/// CockroachDB returns strings like `CockroachDB CCL v23.1.0 (...)`, whereas
/// PostgreSQL returns `PostgreSQL 16.1 on x86_64-pc-linux-gnu ...`. The match is
/// case-insensitive and substring-based so it survives build-info noise.
pub fn detect_pg_dialect(version_str: &str) -> PgDialect {
    if version_str.to_ascii_lowercase().contains("cockroach") {
        PgDialect::CockroachDb
    } else {
        PgDialect::Postgres
    }
}

/// Detect the real engine from a MySQL `SELECT VERSION()` string.
///
/// MariaDB embeds `MariaDB` in the version banner (e.g. `11.4.2-MariaDB`),
/// while MySQL returns a bare version like `8.0.36`. Case-insensitive substring
/// match.
pub fn detect_mysql_dialect(version_str: &str) -> MySqlDialect {
    if version_str.to_ascii_lowercase().contains("mariadb") {
        MySqlDialect::MariaDb
    } else {
        MySqlDialect::MySql
    }
}

/// Feature flags that gate behaviour per detected dialect.
///
/// This is the "source caps" layer: code that wants to know "can I use
/// LISTEN/NOTIFY here?" asks the caps, not the raw enum, so the answer is
/// derived from the *runtime-detected* engine rather than the user's pick.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct SourceCaps {
    /// True when the engine supports Postgres `LISTEN`/`NOTIFY`, which the live
    /// monitor uses for push-based change notifications. CockroachDB does NOT
    /// support it, so live monitoring must fall back to polling (or be hidden).
    pub supports_listen_notify: bool,
}

impl SourceCaps {
    /// Capabilities for a Postgres-wire connection whose dialect is not yet
    /// known. Assumes vanilla Postgres (the safe, existing behaviour).
    pub const fn postgres_default() -> Self {
        Self {
            supports_listen_notify: true,
        }
    }

    /// Capabilities for a MySQL-wire connection whose dialect is not yet known.
    /// MySQL/MariaDB have no Postgres-style LISTEN/NOTIFY; the live monitor
    /// already polls for these engines.
    pub const fn mysql_default() -> Self {
        Self {
            supports_listen_notify: false,
        }
    }

    /// Derive capabilities from a concretely detected dialect.
    pub const fn for_dialect(dialect: DetectedDialect) -> Self {
        match dialect {
            // Vanilla Postgres: full LISTEN/NOTIFY support.
            DetectedDialect::Postgres => Self {
                supports_listen_notify: true,
            },
            // CockroachDB intentionally does not implement LISTEN/NOTIFY.
            // https://github.com/cockroachdb/cockroach/issues/41522
            DetectedDialect::CockroachDb => Self {
                supports_listen_notify: false,
            },
            // MySQL/MariaDB: polling-based monitoring only.
            DetectedDialect::MySql | DetectedDialect::MariaDb => Self {
                supports_listen_notify: false,
            },
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn detects_cockroachdb_from_version_string() {
        let v = "CockroachDB CCL v23.1.0 (x86_64-pc-linux-gnu, built 2023/05/15 ...)";
        assert_eq!(detect_pg_dialect(v), PgDialect::CockroachDb);
    }

    #[test]
    fn detects_vanilla_postgres_from_version_string() {
        let v = "PostgreSQL 16.1 on x86_64-pc-linux-gnu, compiled by gcc ...";
        assert_eq!(detect_pg_dialect(v), PgDialect::Postgres);
    }

    #[test]
    fn detects_cockroachdb_case_insensitively() {
        assert_eq!(detect_pg_dialect("cockroachdb v22.2"), PgDialect::CockroachDb);
    }

    #[test]
    fn detects_mariadb_from_version_string() {
        let v = "11.4.2-MariaDB-1:11.4.2+maria~ubu2404";
        assert_eq!(detect_mysql_dialect(v), MySqlDialect::MariaDb);
    }

    #[test]
    fn detects_vanilla_mysql_from_version_string() {
        assert_eq!(detect_mysql_dialect("8.0.36"), MySqlDialect::MySql);
    }

    #[test]
    fn detects_mariadb_case_insensitively() {
        assert_eq!(detect_mysql_dialect("10.11.8-mariadb"), MySqlDialect::MariaDb);
    }

    #[test]
    fn cockroach_caps_disable_listen_notify() {
        let caps = SourceCaps::for_dialect(DetectedDialect::CockroachDb);
        assert!(!caps.supports_listen_notify);
    }

    #[test]
    fn postgres_caps_enable_listen_notify() {
        let caps = SourceCaps::for_dialect(DetectedDialect::Postgres);
        assert!(caps.supports_listen_notify);
    }

    #[test]
    fn mysql_and_mariadb_caps_disable_listen_notify() {
        assert!(!SourceCaps::for_dialect(DetectedDialect::MySql).supports_listen_notify);
        assert!(!SourceCaps::for_dialect(DetectedDialect::MariaDb).supports_listen_notify);
    }

    #[test]
    fn dialect_conversions_are_consistent() {
        assert_eq!(
            DetectedDialect::from(PgDialect::CockroachDb),
            DetectedDialect::CockroachDb
        );
        assert_eq!(
            DetectedDialect::from(MySqlDialect::MariaDb),
            DetectedDialect::MariaDb
        );
    }
}
