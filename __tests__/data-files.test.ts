import {
	buildConnectionFromDataFiles,
	buildConnectionFromDatabaseFile,
	classifyDroppedPaths,
	connectionNameFromPath,
	databaseTypeForExtension,
	databaseTypeForFile,
	deriveDataFileName,
	extensionOf,
	isDataFilePath,
	isDatabaseFilePath,
	resolveDatabaseTypeForPath,
	type DatabaseFileKind
} from '@studio/features/connections/utils/data-files'
import { describe, expect, it } from 'vitest'

describe('data-files classification', function () {
	it('recognizes flat data file extensions', function () {
		expect(isDataFilePath('/tmp/sales.parquet')).toBe(true)
		expect(isDataFilePath('/tmp/events.ndjson')).toBe(true)
		expect(isDataFilePath('/tmp/customers.csv')).toBe(true)
	})

	it('recognizes sqlite-family database extensions', function () {
		expect(isDatabaseFilePath('/data/app.sqlite3')).toBe(true)
		expect(isDatabaseFilePath('/data/legacy.sqlite2.db')).toBe(true)
		expect(isDatabaseFilePath('/data/archive.db3')).toBe(true)
		expect(databaseTypeForExtension('/data/app.s3db')).toBe('sqlite')
	})

	it('treats duckdb extension as unambiguous', function () {
		expect(databaseTypeForExtension('/data/analytics.duckdb')).toBe('duckdb')
		expect(databaseTypeForFile('/data/analytics.duckdb')).toBe('duckdb')
	})

	it('marks plain .db as ambiguous', function () {
		expect(databaseTypeForExtension('/data/app.db')).toBe('ambiguous')
		expect(extensionOf('/data/app.db')).toBe('db')
	})

	it('classifies mixed drop paths', function () {
		expect(
			classifyDroppedPaths([
				'/tmp/a.csv',
				'/tmp/b.parquet',
				'/tmp/c.sqlite',
				'/tmp/readme.txt'
			])
		).toEqual({
			dataFiles: ['/tmp/a.csv', '/tmp/b.parquet', '/tmp/readme.txt'],
			databaseFiles: ['/tmp/c.sqlite'],
			unsupported: []
		})
	})

	it('resolves ambiguous db via probe', async function () {
		const probe = async function () {
			return 'duckdb' as DatabaseFileKind
		}
		await expect(resolveDatabaseTypeForPath('/tmp/app.db', probe)).resolves.toBe('duckdb')
	})

	it('defaults ambiguous unknown probe to sqlite', async function () {
		const probe = async function () {
			return 'unknown' as DatabaseFileKind
		}
		await expect(resolveDatabaseTypeForPath('/tmp/app.db', probe)).resolves.toBe('sqlite')
	})

	it('builds connection payloads from paths', function () {
		expect(buildConnectionFromDatabaseFile('/tmp/demo.duckdb', 'duckdb')).toEqual({
			name: 'demo',
			type: 'duckdb',
			url: '/tmp/demo.duckdb'
		})
		expect(buildConnectionFromDataFiles(['/tmp/sales.csv', '/tmp/customers.csv'])).toEqual({
			name: 'sales +1 more',
			type: 'duckdb',
			url: ':memory:',
			fileSources: ['/tmp/sales.csv', '/tmp/customers.csv']
		})
		expect(connectionNameFromPath('/tmp/sales.csv')).toBe('sales')
		expect(deriveDataFileName(['/tmp/sales.csv'])).toBe('sales')
	})
})
