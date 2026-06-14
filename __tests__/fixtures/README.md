# Smoke-test fixtures

Sample data for exercising Dora's **file-as-database** path (read-only flat
files queried via an embedded DuckDB) and the **DuckDB provider** (a real
read-write `.duckdb` database).

## Regenerate

```bash
./scripts/generate-test-fixtures.sh                  # curated small set
./scripts/generate-test-fixtures.sh --large 200000   # + data-files/large/big_sales.* (N rows)
```

`generate-test-fixtures.sh` creates a throwaway `.venv` with the `duckdb` package (the only
dependency) — nothing touches system Python. The venv and `data-files/large/`
are gitignored.

## What's here (`data-files/`)

| File | Format | Use |
|------|--------|-----|
| `customers.csv` | CSV | 8 rows, `id` is the key |
| `sales.csv` | CSV | orders; `customer_id` → `customers.id` |
| `customers.parquet` / `sales.parquet` | Parquet | same data, columnar |
| `products.tsv` | TSV | tab-separated; has a boolean column |
| `events.ndjson` | NDJSON | one JSON object per line, with a nested `meta` |
| `regions.json` | JSON | array of objects |
| `demo.duckdb` | DuckDB | **read-write** db: `customers` + `sales` (FK) + `revenue_by_region` view |
| `large/big_sales.*` | CSV/Parquet | only with `--large`; for the "don't freeze on a big scan" test |

## Try it

Flat files (drag `customers.csv` + `sales.csv`, or the `.parquet` pair, onto Dora):

```sql
SELECT c.region, COUNT(*) AS orders, SUM(s.amount) AS revenue
FROM sales s
JOIN customers c ON c.id = s.customer_id
GROUP BY c.region
ORDER BY revenue DESC;
```

Things worth checking:
- **Read-only flat files** — editing a cell / adding a row should be refused (UI hides the affordances).
- **`demo.duckdb`** — opens through the DuckDB provider, is read-write, and shows the `sales → customers` FK + the `revenue_by_region` view.
- **Missing-file recovery** — open a file, close the app, move/rename it, reopen → it should report the missing source, not crash the connection.
