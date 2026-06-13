#!/usr/bin/env bash
# Regenerate the data-file / DuckDB smoke-test fixtures.
#
#   ./generate.sh                 # small curated set (csv/tsv/json/ndjson/parquet + demo.duckdb)
#   ./generate.sh --large 200000  # + tests/fixtures/data-files/large/big_sales.* with N rows
#
# DuckDB is the only dependency; it's pulled into a throwaway local venv so
# nothing touches your system Python.
set -euo pipefail
cd "$(dirname "$0")"

VENV=".venv"
if [ ! -x "$VENV/bin/python" ]; then
  echo "Creating venv + installing duckdb..."
  python3 -m venv "$VENV"
  "$VENV/bin/pip" install --quiet --upgrade pip
  "$VENV/bin/pip" install --quiet duckdb
fi

"$VENV/bin/python" generate_fixtures.py "$@"
