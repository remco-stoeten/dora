#!/usr/bin/env python3
"""
Generate smoke-test fixtures for Dora's file-as-database + DuckDB provider.

Produces, under __tests__/fixtures/data-files/:
  customers.csv / .parquet   - 8 base customers (PK id)
  sales.csv / .parquet       - orders, customer_id -> customers.id
  products.tsv               - tab-separated, has a bool column
  events.ndjson              - newline-delimited JSON with a nested object
  regions.json               - JSON array-of-objects
  demo.duckdb                - real read-write DuckDB db (tables + FK + view)

With --large N it ALSO writes data-files/large/:
  big_sales.csv / .parquet   - N synthetic rows (for the "don't freeze the
                               UI on a big scan" test). N=2_000_000 ~= a few
                               hundred MB of CSV.

Usage:
  ./generate-test-fixtures.sh                 # small curated set only
  ./generate-test-fixtures.sh --large 200000  # + a 200k-row big_sales set
"""

import argparse
import datetime as dt
import json
import os
import random

import duckdb

HERE = os.path.dirname(os.path.abspath(__file__))
REPO_ROOT = os.path.dirname(HERE)
FIXTURES_ROOT = os.path.join(REPO_ROOT, "__tests__", "fixtures")
OUT = os.path.join(FIXTURES_ROOT, "data-files")

REGIONS = [
    {"code": "EMEA", "label": "Europe, Middle East & Africa", "tz_offset": 1},
    {"code": "APAC", "label": "Asia-Pacific", "tz_offset": 8},
    {"code": "AMER", "label": "Americas", "tz_offset": -5},
]

CUSTOMERS = [
    (1, "Maya Chen", "maya@dora.dev", "EMEA", "pro", "2024-01-15"),
    (2, "Ravi Patel", "ravi@dora.dev", "APAC", "free", "2024-02-03"),
    (3, "Lina Novak", "lina@dora.dev", "EMEA", "pro", "2024-02-28"),
    (4, "Tom Becker", "tom@dora.dev", "AMER", "enterprise", "2024-03-12"),
    (5, "Sofia Rossi", "sofia@dora.dev", "EMEA", "free", "2024-04-01"),
    (6, "Kenji Tanaka", "kenji@dora.dev", "APAC", "pro", "2024-04-22"),
    (7, "Grace Adeyemi", "grace@dora.dev", "AMER", "pro", "2024-05-09"),
    (8, "Oliver Smith", "oliver@dora.dev", "AMER", "free", "2024-06-17"),
]

SALES = [
    (1001, 1, "Annual Pro", "240.00", "USD", "2024-01-15"),
    (1002, 3, "Annual Pro", "240.00", "USD", "2024-03-01"),
    (1003, 4, "Enterprise Seat", "1200.00", "USD", "2024-03-12"),
    (1004, 1, "Add-on Storage", "48.00", "USD", "2024-03-20"),
    (1005, 6, "Annual Pro", "240.00", "USD", "2024-04-22"),
    (1006, 7, "Annual Pro", "240.00", "USD", "2024-05-09"),
    (1007, 4, "Enterprise Seat", "1200.00", "USD", "2024-05-30"),
    (1008, 3, "Add-on Storage", "48.00", "USD", "2024-06-02"),
    (1009, 7, "Add-on Storage", "48.00", "USD", "2024-06-11"),
    (1010, 4, "Enterprise Seat", "1200.00", "USD", "2024-06-25"),
]

PRODUCTS = [
    ("ANNUAL-PRO", "Annual Pro", "subscription", "240.00", "true"),
    ("ENT-SEAT", "Enterprise Seat", "subscription", "1200.00", "true"),
    ("ADDON-STORAGE", "Add-on Storage", "addon", "48.00", "true"),
    ("ADDON-SEATS", "Extra Seats", "addon", "96.00", "false"),
    ("TRIAL", "Free Trial", "subscription", "0.00", "true"),
]

EVENTS = [
    {"event": "login", "customer_id": 1, "ts": "2024-06-01T09:14:00Z", "meta": {"ip": "10.0.0.1", "ok": True}},
    {"event": "query_run", "customer_id": 1, "ts": "2024-06-01T09:15:22Z", "meta": {"rows": 482, "ms": 11}},
    {"event": "login", "customer_id": 3, "ts": "2024-06-02T11:02:10Z", "meta": {"ip": "10.0.0.7", "ok": True}},
    {"event": "export", "customer_id": 4, "ts": "2024-06-02T14:48:55Z", "meta": {"format": "csv", "rows": 12000}},
    {"event": "login", "customer_id": 7, "ts": "2024-06-03T08:30:00Z", "meta": {"ip": "10.0.0.9", "ok": False}},
    {"event": "query_run", "customer_id": 7, "ts": "2024-06-03T08:31:40Z", "meta": {"rows": 3, "ms": 3}},
]


def write_csv(path, header, rows, sep=","):
    with open(path, "w", newline="") as f:
        f.write(sep.join(header) + "\n")
        for r in rows:
            f.write(sep.join(str(c) for c in r) + "\n")
    print("wrote", os.path.relpath(path, FIXTURES_ROOT))


def to_parquet(con, csv_path, parquet_path):
    con.execute(
        f"COPY (SELECT * FROM read_csv_auto('{csv_path}')) "
        f"TO '{parquet_path}' (FORMAT PARQUET)"
    )
    print("wrote", os.path.relpath(parquet_path, FIXTURES_ROOT))


def small_set():
    os.makedirs(OUT, exist_ok=True)
    write_csv(os.path.join(OUT, "customers.csv"),
              ["id", "name", "email", "region", "plan", "signup_date"], CUSTOMERS)
    write_csv(os.path.join(OUT, "sales.csv"),
              ["order_id", "customer_id", "product", "amount", "currency", "ordered_at"], SALES)
    write_csv(os.path.join(OUT, "products.tsv"),
              ["sku", "name", "category", "unit_price", "in_stock"], PRODUCTS, sep="\t")

    with open(os.path.join(OUT, "events.ndjson"), "w") as f:
        for e in EVENTS:
            f.write(json.dumps(e) + "\n")
    print("wrote", "data-files/events.ndjson")

    with open(os.path.join(OUT, "regions.json"), "w") as f:
        json.dump(REGIONS, f, indent=2)
        f.write("\n")
    print("wrote", "data-files/regions.json")

    con = duckdb.connect()
    to_parquet(con, os.path.join(OUT, "customers.csv"), os.path.join(OUT, "customers.parquet"))
    to_parquet(con, os.path.join(OUT, "sales.csv"), os.path.join(OUT, "sales.parquet"))
    con.close()

    # real read-write DuckDB database
    db_path = os.path.join(OUT, "demo.duckdb")
    if os.path.exists(db_path):
        os.remove(db_path)
    db = duckdb.connect(db_path)
    db.execute("""
        CREATE TABLE customers (
            id INTEGER PRIMARY KEY, name VARCHAR NOT NULL, email VARCHAR,
            region VARCHAR, plan VARCHAR, signup_date DATE)
    """)
    db.execute("""
        CREATE TABLE sales (
            order_id INTEGER PRIMARY KEY, customer_id INTEGER REFERENCES customers(id),
            product VARCHAR, amount DECIMAL(10,2), currency VARCHAR, ordered_at DATE)
    """)
    db.execute(f"INSERT INTO customers SELECT * FROM read_csv_auto('{OUT}/customers.csv')")
    db.execute(f"INSERT INTO sales SELECT * FROM read_csv_auto('{OUT}/sales.csv')")
    db.execute("""
        CREATE VIEW revenue_by_region AS
        SELECT c.region, COUNT(*) AS orders, SUM(s.amount) AS revenue
        FROM sales s JOIN customers c ON c.id = s.customer_id
        GROUP BY c.region
    """)
    db.close()
    print("wrote", "data-files/demo.duckdb")


def large_set(n):
    big_dir = os.path.join(OUT, "large")
    os.makedirs(big_dir, exist_ok=True)
    rng = random.Random(42)
    products = [p[1] for p in PRODUCTS]
    base = dt.date(2024, 1, 1)
    csv_path = os.path.join(big_dir, "big_sales.csv")
    with open(csv_path, "w") as f:
        f.write("order_id,customer_id,product,amount,currency,ordered_at\n")
        for i in range(1, n + 1):
            cid = rng.randint(1, len(CUSTOMERS))
            prod = rng.choice(products)
            amt = rng.choice([48.00, 96.00, 240.00, 1200.00])
            day = base + dt.timedelta(days=rng.randint(0, 540))
            f.write(f"{i},{cid},{prod},{amt:.2f},USD,{day.isoformat()}\n")
    print(f"wrote large/big_sales.csv ({n:,} rows)")
    con = duckdb.connect()
    to_parquet(con, csv_path, os.path.join(big_dir, "big_sales.parquet"))
    con.close()


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--large", type=int, metavar="N",
                    help="also generate large/big_sales with N rows")
    args = ap.parse_args()
    small_set()
    if args.large:
        large_set(args.large)
    print("done.")


if __name__ == "__main__":
    main()
