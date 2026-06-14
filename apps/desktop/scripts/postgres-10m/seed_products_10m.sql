\timing on

CREATE EXTENSION IF NOT EXISTS pg_trgm;

DROP TABLE IF EXISTS amazon_de_products;

CREATE TABLE amazon_de_products (
    id BIGSERIAL PRIMARY KEY,
    market TEXT NOT NULL DEFAULT 'DE',
    url TEXT NOT NULL,
    title TEXT NOT NULL,
    img TEXT NOT NULL,
    brand TEXT NOT NULL,
    product_type TEXT NOT NULL,
    category TEXT NOT NULL,
    category_2 TEXT NOT NULL,
    category_2_short TEXT NOT NULL,
    rating TEXT NOT NULL,
    ratings_count INTEGER NOT NULL,
    first_seen_year INTEGER NOT NULL,
    payload JSONB NOT NULL
);

ALTER TABLE amazon_de_products SET (autovacuum_enabled = false);

INSERT INTO amazon_de_products (
    market,
    url,
    title,
    img,
    brand,
    product_type,
    category,
    category_2,
    category_2_short,
    rating,
    ratings_count,
    first_seen_year,
    payload
)
SELECT
    'DE',
    url,
    title,
    img,
    brand,
    product_type,
    category,
    category_2,
    category_2_short,
    rating,
    ratings_count,
    first_seen_year,
    jsonb_build_object(
        'DE',
        jsonb_build_object(
            'url', url,
            'title', title,
            'img', img,
            'brand', brand,
            'productType', product_type,
            'parentAsin', false,
            'category', category,
            'category 2', category_2,
            'category 2 short', category_2_short,
            'rating', rating,
            'ratings count', ratings_count,
            'salesRanks', jsonb_build_array(
                jsonb_build_object('category', rank_category, 'rank', primary_rank),
                jsonb_build_object('category', sub_rank_category, 'rank', secondary_rank)
            ),
            'dimensions', dimensions,
            'MPN', mpn,
            'firstSeen', first_seen,
            'firstSeenYear', first_seen_year,
            'variants', jsonb_build_array(
                jsonb_build_object('asin', variant_asin_1, 'size_name', variant_size_1),
                jsonb_build_object('asin', asin, 'size_name', variant_size_2)
            )
        )
    )
FROM (
    SELECT
        g,
        asin,
        brand,
        product_type,
        category,
        category_2,
        category_2_short,
        rank_category,
        sub_rank_category,
        primary_rank,
        secondary_rank,
        ratings_count,
        first_seen_year,
        first_seen,
        dimensions,
        mpn,
        variant_asin_1,
        variant_size_1,
        variant_size_2,
        'https://www.amazon.de/dp/' || asin AS url,
        'https://m.media-amazon.com/images/I/' || substr(md5(g::text || ':image'), 1, 14) || '.jpg' AS img,
        CASE
            WHEN g <= 38000 THEN
                'Corsair VENGEANCE DDR5 RAM ' || ((g % 8) + 1) * 16 || 'GB (' ||
                CASE WHEN g % 2 = 0 THEN '2x32GB' ELSE '2x16GB' END ||
                ') ' || (4400 + (g % 12) * 200) || 'MHz CL' || (32 + (g % 10)) ||
                ' Intel XMP iCUE Compatible Computer Memory - Black (' || mpn || ')'
            ELSE
                brand || ' ' || product_line || ' ' || product_type_label || ' ' ||
                ((g % 12) + 1) || ' Pack Model ' || upper(substr(md5(g::text || ':title'), 1, 8))
        END AS title,
        ((35 + (g % 15))::numeric / 10)::text || ' out of 5 stars' AS rating
    FROM (
        SELECT
            g,
            'B' || upper(substr(md5(g::text || ':asin'), 1, 9)) AS asin,
            CASE
                WHEN g <= 38000 THEN 'Corsair'
                ELSE (ARRAY[
                    'Logitech', 'Samsung', 'Kingston', 'Crucial', 'SanDisk',
                    'Seagate', 'Western Digital', 'ASUS', 'MSI', 'Acer',
                    'Lenovo', 'HP', 'Dell', 'Sony', 'Belkin', 'Anker'
                ])[1 + (g % 16)]
            END AS brand,
            CASE
                WHEN g <= 38000 THEN 'INTERNAL_MEMORY'
                ELSE (ARRAY[
                    'KEYBOARD', 'MOUSE', 'SSD', 'MONITOR', 'USB_HUB',
                    'WEBCAM', 'HEADSET', 'LAPTOP_DOCK', 'NETWORK_ADAPTER', 'CABLE'
                ])[1 + (g % 10)]
            END AS product_type,
            CASE
                WHEN g <= 38000 THEN 'Computer Memory'
                ELSE (ARRAY[
                    'Computer & Accessories', 'Electronics', 'Office Products',
                    'Storage Devices', 'Input Devices'
                ])[1 + (g % 5)]
            END AS category,
            CASE
                WHEN g <= 38000 THEN 'Personal Computers'
                ELSE (ARRAY[
                    'Computer Accessories', 'Consumer Electronics',
                    'Data Storage', 'Office Electronics', 'PC Components'
                ])[1 + (g % 5)]
            END AS category_2,
            CASE
                WHEN g <= 38000 THEN 'pc'
                ELSE (ARRAY['accessories', 'electronics', 'storage', 'office', 'components'])[1 + (g % 5)]
            END AS category_2_short,
            CASE
                WHEN g <= 38000 THEN 'Computer & Accessories'
                ELSE (ARRAY['Electronics', 'Office Products', 'PC Components', 'Accessories'])[1 + (g % 4)]
            END AS rank_category,
            CASE
                WHEN g <= 38000 THEN 'Computer Memory'
                ELSE (ARRAY['Keyboards', 'Mice', 'Storage', 'Monitors', 'Adapters'])[1 + (g % 5)]
            END AS sub_rank_category,
            1 + (((hashtext(g::text || ':rank1')::bigint + 2147483648) % 1000000)::int) AS primary_rank,
            1 + (((hashtext(g::text || ':rank2')::bigint + 2147483648) % 10000)::int) AS secondary_rank,
            1 + (((hashtext(g::text || ':ratings')::bigint + 2147483648) % 250000)::int) AS ratings_count,
            2018 + (g % 9) AS first_seen_year,
            to_char(
                date '2018-01-01' + ((g % 3000)::int),
                'DD FMMonth YYYY'
            ) AS first_seen,
            (8 + (g % 30)) || '.' || (g % 10) || ' x ' ||
                (1 + (g % 12)) || '.' || ((g / 3) % 10) || ' x ' ||
                (1 + (g % 8)) || '.' || ((g / 7) % 10) || ' cm; ' ||
                (20 + (g % 980)) || ' g' AS dimensions,
            CASE
                WHEN g <= 38000 THEN 'CMK' || (16 + (g % 128)) || 'GX' || (1 + (g % 4)) || 'M2A' || (4400 + (g % 12) * 200) || 'C' || (32 + (g % 10))
                ELSE upper(substr(md5(g::text || ':mpn'), 1, 14))
            END AS mpn,
            'B' || upper(substr(md5(g::text || ':variant1'), 1, 9)) AS variant_asin_1,
            CASE WHEN g <= 38000 THEN '32 GB' ELSE ((g % 6) + 1)::text || ' Pack' END AS variant_size_1,
            CASE WHEN g <= 38000 THEN '64GB (2x32GB)' ELSE ((g % 4) + 1)::text || ' Unit' END AS variant_size_2,
            CASE
                WHEN g <= 38000 THEN 'VENGEANCE'
                ELSE (ARRAY['Pro', 'Ultra', 'Max', 'Prime', 'Select', 'Studio'])[1 + (g % 6)]
            END AS product_line,
            CASE
                WHEN g <= 38000 THEN 'RAM'
                ELSE (ARRAY['Keyboard', 'Mouse', 'Drive', 'Display', 'Adapter', 'Cable'])[1 + (g % 6)]
            END AS product_type_label
        FROM generate_series(1, 10000000) AS s(g)
    ) generated
) products;

CREATE INDEX amazon_de_products_brand_idx ON amazon_de_products (brand);
CREATE INDEX amazon_de_products_title_trgm_idx ON amazon_de_products USING gin (title gin_trgm_ops);
CREATE INDEX amazon_de_products_payload_gin_idx ON amazon_de_products USING gin (payload jsonb_path_ops);

ALTER TABLE amazon_de_products SET (autovacuum_enabled = true);
ANALYZE amazon_de_products;

SELECT
    count(*) AS total_rows,
    count(*) FILTER (WHERE title ILIKE '%corsair%' OR brand ILIKE '%corsair%') AS corsair_rows,
    count(*) FILTER (WHERE id > 38000 AND (title ILIKE '%corsair%' OR brand ILIKE '%corsair%')) AS unexpected_corsair_rows
FROM amazon_de_products;
