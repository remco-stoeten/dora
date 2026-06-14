#!/usr/bin/env bash
set -euo pipefail

docker compose -f docker-compose.postgres-10m.yml up -d postgres-10m

until docker exec dora-postgres-10m psql -U dora -d dora_10m -c "select 1" >/dev/null 2>&1; do
  sleep 1
done

docker exec -i dora-postgres-10m psql -U dora -d dora_10m -v ON_ERROR_STOP=1 < scripts/postgres-10m/seed_products_10m.sql
