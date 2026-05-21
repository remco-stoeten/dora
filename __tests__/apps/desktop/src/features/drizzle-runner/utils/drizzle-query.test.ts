import { describe, expect, it } from 'vitest'
import { drizzleQueryToSql } from '@/features/drizzle-runner/utils/drizzle-query'

describe('drizzleQueryToSql', function () {
	it('converts a simple Drizzle select with limit', function () {
		expect(drizzleQueryToSql('db.select().from(messages).limit(100)')).toBe(
			'SELECT * FROM messages LIMIT 100'
		)
	})

	it('converts schema-qualified table names', function () {
		expect(drizzleQueryToSql('db.select().from(public.messages).limit(25);')).toBe(
			'SELECT * FROM public.messages LIMIT 25'
		)
	})

	it('extracts SQL from db.execute(sql template)', function () {
		expect(
			drizzleQueryToSql(`db.execute(sql\`
  SELECT table_name
  FROM information_schema.tables
  WHERE table_schema = 'public'
  ORDER BY table_name;
\`);`)
		).toBe(`SELECT table_name
  FROM information_schema.tables
  WHERE table_schema = 'public'
  ORDER BY table_name;`)
	})

	it('extracts bare sql templates', function () {
		expect(drizzleQueryToSql("sql`SELECT * FROM messages LIMIT 1`")).toBe(
			'SELECT * FROM messages LIMIT 1'
		)
	})

	it('rejects unsupported chains instead of sending JavaScript to the SQL backend', function () {
		expect(function () {
			drizzleQueryToSql('db.select().from(messages).where(eq(messages.id, 1))')
		}).toThrow('Unsupported Drizzle query')
	})
})
