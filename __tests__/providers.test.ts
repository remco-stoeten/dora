import { describe, expect, it } from 'vitest'

import { detectProviderName, parseConnectionUrl } from '@studio/features/connections/utils/providers'

describe('detectProviderName', function () {
	it('detects MariaDB hosts as a MySQL-compatible provider', function () {
		expect(
			detectProviderName('mysql://user:pass@mariadb.internal:3306/app')
		).toBe('MariaDB DB')
	})

	it('detects CockroachDB hosts as a Postgres-compatible provider', function () {
		expect(
			detectProviderName('postgresql://user:pass@cockroach.example.com:26257/defaultdb')
		).toBe('CockroachDB')
	})

	it('detects CRDB shorthand hosts', function () {
		expect(detectProviderName('postgresql://user:pass@crdb.prod.local/db')).toBe(
			'CockroachDB'
		)
	})

	it('detects CockroachDB from its default SQL port even with a postgres scheme', function () {
		expect(
			parseConnectionUrl('postgresql://root@127.0.0.1:26257/defaultdb?sslmode=disable')?.type
		).toBe('cockroach')
	})

	it('detects CockroachDB from its default SQL port name', function () {
		expect(detectProviderName('postgresql://root@127.0.0.1:26257/defaultdb')).toBe(
			'CockroachDB'
		)
	})
})
