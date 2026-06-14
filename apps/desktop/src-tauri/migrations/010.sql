-- Migration 010: Add remaining database types
-- 007.sql added libsql/mysql but cockroach (5), mariadb (6), and duckdb (7)
-- were still missing. Without these rows the `database_types` LEFT JOIN in
-- connection loading yields NULL, COALESCE falls back to 'postgres', and the
-- stored connection is mis-decoded as Postgres ("Postgres connection not
-- active"). Seed them so type decoding works for all supported engines.

INSERT OR IGNORE INTO database_types (id, name) VALUES
  (5, 'cockroach'),
  (6, 'mariadb'),
  (7, 'duckdb');
