use std::error::Error;
use std::fmt::Write;

use bytes::Buf;
use chrono::Utc;
use tokio_postgres::types::{FromSql, Type};

use super::{interval::PgInterval, numeric::PostgresNumeric};

/// Deserializes record types into a JSON array
/// E.g. `ROW('("fuzzy dice",42,1.99)'` -> `["fuzzy dice", 42, 1.99]`
#[derive(Debug)]
pub struct PgRecord {
    pub json: String,
}

impl<'a> FromSql<'a> for PgRecord {
    fn from_sql(_: &Type, mut raw: &'a [u8]) -> Result<Self, Box<dyn Error + Sync + Send>> {
        ensure_remaining(raw, 4, "record field count")?;
        let field_count = raw.get_i32();
        if field_count < 0 {
            return Err("Invalid record field count".into());
        }

        let field_count = field_count as usize;
        let mut json = String::new();
        json.push('[');

        for field_index in 0..field_count {
            ensure_remaining(raw, 8, "record field header")?;
            let field_oid = raw.get_u32();
            let field_length = raw.get_i32();

            if field_index > 0 {
                json.push(',');
            }

            if field_length == -1 {
                json.push_str("null");
            } else {
                if field_length < 0 {
                    return Err("Invalid record field length".into());
                }

                let field_length = field_length as usize;
                ensure_remaining(raw, field_length, "record field data")?;

                let field_data = &raw[..field_length];
                raw.advance(field_length);

                let pg_type = Type::from_oid(field_oid).unwrap_or(Type::TEXT);
                write_pg_binary_as_json(&mut json, &pg_type, field_data)?;
            }
        }

        json.push(']');
        Ok(PgRecord { json })
    }

    fn accepts(ty: &Type) -> bool {
        matches!(*ty, Type::RECORD)
    }
}

#[allow(clippy::wildcard_in_or_patterns)]
fn write_pg_binary_as_json(
    out: &mut String,
    pg_type: &Type,
    data: &[u8],
) -> Result<(), Box<dyn Error + Sync + Send>> {
    let mut buf = data;

    match *pg_type {
        Type::BOOL => {
            ensure_remaining(buf, 1, "bool")?;
            let value = buf.get_u8() != 0;
            out.push_str(if value { "true" } else { "false" });
        }

        Type::INT2 => {
            ensure_remaining(buf, 2, "int2")?;
            let value = buf.get_i16();
            write!(out, "{}", value)?;
        }
        Type::INT4 => {
            ensure_remaining(buf, 4, "int4")?;
            let value = buf.get_i32();
            write!(out, "{}", value)?;
        }
        Type::INT8 => {
            ensure_remaining(buf, 8, "int8")?;
            let value = buf.get_i64();
            write!(out, "{}", value)?;
        }

        Type::FLOAT4 => {
            ensure_remaining(buf, 4, "float4")?;
            let value = buf.get_f32();
            if value.is_finite() {
                write!(out, "{}", value)?;
            } else {
                write_json_string(out, &value.to_string());
            }
        }
        Type::FLOAT8 => {
            ensure_remaining(buf, 8, "float8")?;
            let value = buf.get_f64();
            if value.is_finite() {
                write!(out, "{}", value)?;
            } else {
                write_json_string(out, &value.to_string());
            }
        }

        Type::NUMERIC => {
            let value = PostgresNumeric::from_sql(&Type::NUMERIC, data)?;
            write_json_string(out, &value.to_string());
        }
        Type::JSON | Type::JSONB => {
            let value = serde_json::Value::from_sql(pg_type, data)?;
            out.push_str(&value.to_string());
        }
        Type::UUID => {
            let value = uuid::Uuid::from_sql(&Type::UUID, data)?;
            write_json_string(out, &value.to_string());
        }
        Type::TEXT_ARRAY | Type::INT4_ARRAY | Type::INT8_ARRAY => {
            write_pg_array_as_json(out, data)?;
        }
        Type::TIMESTAMP => {
            ensure_remaining(buf, 8, "timestamp")?;
            let microseconds = buf.get_i64();
            // PostgreSQL epoch is 2000-01-01 00:00:00 UTC
            let pg_epoch = chrono::NaiveDate::from_ymd_opt(2000, 1, 1)
                .unwrap()
                .and_hms_opt(0, 0, 0)
                .unwrap();
            let timestamp = pg_epoch + chrono::Duration::microseconds(microseconds);
            write_json_string(out, &timestamp.to_string());
        }
        Type::TIMESTAMPTZ => {
            ensure_remaining(buf, 8, "timestamptz")?;
            let microseconds = buf.get_i64();
            let pg_epoch = chrono::NaiveDate::from_ymd_opt(2000, 1, 1)
                .unwrap()
                .and_hms_opt(0, 0, 0)
                .unwrap();
            let timestamp = chrono::DateTime::<Utc>::from_naive_utc_and_offset(pg_epoch, Utc)
                + chrono::Duration::microseconds(microseconds);
            write_json_string(out, &timestamp.to_string());
        }
        Type::INTERVAL => {
            let value = PgInterval::from_sql(&Type::INTERVAL, data)?;
            write_json_string(out, &value.to_string());
        }
        Type::RECORD => {
            let value = PgRecord::from_sql(&Type::RECORD, data)?;
            out.push_str(&value.json);
        }

        // For text types and unknown types, convert to string
        Type::TEXT | Type::VARCHAR | Type::BPCHAR | Type::NAME | _ => {
            match std::str::from_utf8(data) {
                Ok(s) => write_json_string(out, s),
                Err(_) => {
                    write_hex_json_string(out, data);
                }
            }
        }
    }

    Ok(())
}

fn write_pg_array_as_json(
    out: &mut String,
    mut raw: &[u8],
) -> Result<(), Box<dyn Error + Sync + Send>> {
    ensure_remaining(raw, 12, "array header")?;
    let dimensions = raw.get_i32();
    let _has_null = raw.get_i32();
    let element_oid = raw.get_u32();

    if dimensions < 0 {
        return Err("Invalid array dimensions".into());
    }

    if dimensions == 0 {
        out.push_str("[]");
        return Ok(());
    }

    let dimensions = dimensions as usize;
    let mut lengths = Vec::with_capacity(dimensions);
    for _ in 0..dimensions {
        ensure_remaining(raw, 8, "array dimension")?;
        let length = raw.get_i32();
        let _lower_bound = raw.get_i32();
        if length < 0 {
            return Err("Invalid array dimension length".into());
        }
        lengths.push(length as usize);
    }

    let element_type = Type::from_oid(element_oid).unwrap_or(Type::TEXT);
    write_pg_array_dimension_as_json(out, &mut raw, &lengths, 0, &element_type)
}

fn write_pg_array_dimension_as_json(
    out: &mut String,
    raw: &mut &[u8],
    lengths: &[usize],
    dimension_index: usize,
    element_type: &Type,
) -> Result<(), Box<dyn Error + Sync + Send>> {
    out.push('[');
    for i in 0..lengths[dimension_index] {
        if i > 0 {
            out.push(',');
        }

        if dimension_index + 1 == lengths.len() {
            ensure_remaining(*raw, 4, "array element length")?;
            let element_length = raw.get_i32();
            if element_length == -1 {
                out.push_str("null");
                continue;
            }

            if element_length < 0 {
                return Err("Invalid array element length".into());
            }

            let element_length = element_length as usize;
            ensure_remaining(*raw, element_length, "array element data")?;
            let element_data = &raw[..element_length];
            raw.advance(element_length);
            write_pg_binary_as_json(out, element_type, element_data)?;
        } else {
            write_pg_array_dimension_as_json(out, raw, lengths, dimension_index + 1, element_type)?;
        }
    }
    out.push(']');
    Ok(())
}

fn write_json_string(out: &mut String, s: &str) {
    out.push('"');
    for ch in s.chars() {
        match ch {
            '"' => out.push_str("\\\""),
            '\\' => out.push_str("\\\\"),
            '\n' => out.push_str("\\n"),
            '\r' => out.push_str("\\r"),
            '\t' => out.push_str("\\t"),
            c if c.is_control() => {
                write!(out, "\\u{:04x}", c as u32).expect("write to String buf");
            }
            c => out.push(c),
        }
    }
    out.push('"');
}

fn write_hex_json_string(out: &mut String, data: &[u8]) {
    out.push('"');
    out.push_str("\\\\x");

    let mut encoded = vec![0; data.len() * 2];
    hex::encode_to_slice(data, &mut encoded).expect("hex output buffer has exact length");
    let encoded = std::str::from_utf8(&encoded).expect("hex output is valid UTF-8");
    out.push_str(encoded);

    out.push('"');
}

fn ensure_remaining(
    buf: &[u8],
    needed: usize,
    context: &'static str,
) -> Result<(), Box<dyn Error + Sync + Send>> {
    if buf.remaining() < needed {
        return Err(format!("Not enough data for {}", context).into());
    }
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    fn field(ty: &Type, value: Option<Vec<u8>>) -> (u32, Option<Vec<u8>>) {
        (ty.oid(), value)
    }

    fn record_bytes(fields: Vec<(u32, Option<Vec<u8>>)>) -> Vec<u8> {
        let mut bytes = Vec::new();
        bytes.extend_from_slice(&(fields.len() as i32).to_be_bytes());

        for (oid, value) in fields {
            bytes.extend_from_slice(&oid.to_be_bytes());
            match value {
                Some(value) => {
                    bytes.extend_from_slice(&(value.len() as i32).to_be_bytes());
                    bytes.extend_from_slice(&value);
                }
                None => bytes.extend_from_slice(&(-1_i32).to_be_bytes()),
            }
        }

        bytes
    }

    fn hex_to_bytes(hex: &str) -> Vec<u8> {
        (0..hex.len())
            .step_by(2)
            .map(|i| u8::from_str_radix(&hex[i..i + 2], 16).unwrap())
            .collect()
    }

    fn int4_array(values: &[Option<i32>]) -> Vec<u8> {
        let mut bytes = Vec::new();
        bytes.extend_from_slice(&1_i32.to_be_bytes());
        bytes.extend_from_slice(&(values.iter().any(Option::is_none) as i32).to_be_bytes());
        bytes.extend_from_slice(&Type::INT4.oid().to_be_bytes());
        bytes.extend_from_slice(&(values.len() as i32).to_be_bytes());
        bytes.extend_from_slice(&1_i32.to_be_bytes());

        for value in values {
            match value {
                Some(value) => {
                    bytes.extend_from_slice(&4_i32.to_be_bytes());
                    bytes.extend_from_slice(&value.to_be_bytes());
                }
                None => bytes.extend_from_slice(&(-1_i32).to_be_bytes()),
            }
        }

        bytes
    }

    #[test]
    fn record_from_sql_writes_json_array_directly() {
        let nested = record_bytes(vec![field(&Type::BOOL, Some(vec![1]))]);
        let record = record_bytes(vec![
            field(&Type::INT4, Some(42_i32.to_be_bytes().to_vec())),
            field(&Type::TEXT, Some(b"a\"b\n".to_vec())),
            field(&Type::TEXT, None),
            field(
                &Type::NUMERIC,
                Some(hex_to_bytes("0003000100000004000109291a85")),
            ),
            field(
                &Type::INT4_ARRAY,
                Some(int4_array(&[Some(1), None, Some(2)])),
            ),
            field(&Type::RECORD, Some(nested)),
        ]);

        let record = PgRecord::from_sql(&Type::RECORD, &record).unwrap();
        assert_eq!(
            serde_json::from_str::<serde_json::Value>(&record.json).unwrap(),
            serde_json::json!([42, "a\"b\n", null, "12345.6789", [1, null, 2], [true]])
        );
    }

    #[test]
    fn truncated_record_returns_error_instead_of_panicking() {
        let err = PgRecord::from_sql(&Type::RECORD, &[0, 0, 0]).unwrap_err();
        assert!(err.to_string().contains("record field count"));
    }
}
