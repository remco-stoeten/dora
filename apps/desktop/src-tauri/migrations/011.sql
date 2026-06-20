-- Migration 011: Add the Cloudflare D1 database type.
-- D1 is a new engine (id 8) queried over HTTP. Without this row the
-- `database_types` LEFT JOIN in connection loading yields NULL, COALESCE falls
-- back to 'postgres', and a stored D1 connection is mis-decoded as Postgres.

INSERT OR IGNORE INTO database_types (id, name) VALUES
  (8, 'd1');
