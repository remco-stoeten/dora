import { describe, it, expect } from 'vitest'
import { splitSqlStatements } from '@/features/database-studio/utils/studio-data'

describe('splitSqlStatements', () => {
	it('splits on top-level semicolons and trims', () => {
		expect(splitSqlStatements('SELECT 1; SELECT 2;')).toEqual(['SELECT 1', 'SELECT 2'])
	})

	it('ignores trailing/empty statements', () => {
		expect(splitSqlStatements('SELECT 1;;\n  ;')).toEqual(['SELECT 1'])
	})

	it('does not split on semicolons inside quoted strings', () => {
		expect(splitSqlStatements(`INSERT INTO t VALUES ('a;b'); SELECT 1;`)).toEqual([
			`INSERT INTO t VALUES ('a;b')`,
			'SELECT 1'
		])
	})

	it('does not split inside double-quoted identifiers', () => {
		expect(splitSqlStatements(`SELECT "a;b" FROM t; SELECT 2;`)).toEqual([
			`SELECT "a;b" FROM t`,
			'SELECT 2'
		])
	})

	it('ignores semicolons in line comments', () => {
		expect(splitSqlStatements('SELECT 1; -- a; b\nSELECT 2;')).toEqual([
			'SELECT 1',
			'-- a; b\nSELECT 2'
		])
	})

	it('returns empty array for blank input', () => {
		expect(splitSqlStatements('   \n  ')).toEqual([])
	})
})
