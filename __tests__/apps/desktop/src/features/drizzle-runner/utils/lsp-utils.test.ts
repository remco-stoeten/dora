import { describe, expect, it } from 'vitest'
import { generateDrizzleTypes } from '@/features/drizzle-runner/utils/lsp-utils'
import type { SchemaTable } from '@/features/drizzle-runner/types'

const tables: SchemaTable[] = [
	{
		name: 'users',
		columns: [
			{
				name: 'id',
				type: 'serial',
				nullable: false,
				primaryKey: true
			},
			{
				name: 'email',
				type: 'varchar',
				nullable: false,
				primaryKey: false
			},
			{
				name: 'last_login_at',
				type: 'timestamp',
				nullable: true,
				primaryKey: false
			}
		]
	},
	{
		name: 'public.audit_logs',
		columns: [
			{
				name: 'event',
				type: 'text',
				nullable: false,
				primaryKey: false
			},
			{
				name: 'metadata',
				type: 'jsonb',
				nullable: true,
				primaryKey: false
			}
		]
	}
]

describe('generateDrizzleTypes', function () {
	it('generates table object declarations and a schema object', function () {
		const output = generateDrizzleTypes(tables)

		expect(output).toContain("type UsersTable = Table<'users', UsersColumns, UsersRow>;")
		expect(output).toContain('declare const users: UsersTable;')
		expect(output).toContain('declare const schema: {')
		expect(output).toContain('    users: UsersTable;')
		expect(output).toContain("    'public.audit_logs': PublicAuditLogsTable;")
	})

	it('generates column and row member types with nullability', function () {
		const output = generateDrizzleTypes(tables)

		expect(output).toContain("id: Column<number, 'id'>;")
		expect(output).toContain("email: Column<string, 'email'>;")
		expect(output).toContain("last_login_at: Column<Date | null, 'last_login_at'>;")
		expect(output).toContain('last_login_at: Date | null;')
		expect(output).toContain("metadata: Column<unknown | null, 'metadata'>;")
		expect(output).toContain('metadata: unknown | null;')
	})

	it('generates db.query relational helpers per table', function () {
		const output = generateDrizzleTypes(tables)

		expect(output).toContain('interface QueryObject {')
		expect(output).toContain('    users: RelationalQuery<UsersRow, UsersColumns>;')
		expect(output).toContain(
			"    'public.audit_logs': RelationalQuery<PublicAuditLogsRow, PublicAuditLogsColumns>;"
		)
		expect(output).toContain('findMany(options?: QueryFindManyOptions<TRow, TColumns>): Promise<TRow[]>;')
		expect(output).toContain(
			'findFirst(options?: QueryFindFirstOptions<TRow, TColumns>): Promise<TRow | undefined>;'
		)
	})

	it('generates query helper and select builder declarations for inference', function () {
		const output = generateDrizzleTypes(tables)

		expect(output).toContain('declare function eq<T>(column: Column<T>, value: T): SQL<boolean>;')
		expect(output).toContain('declare function sql<T = unknown>')
		expect(output).toContain('select<TSelection extends Record<string, AnyColumn | SQL<unknown> | AnyTable>>')
		expect(output).toContain(
			"): QueryBuilder<TSelection extends undefined ? TTable['_']['inferSelect'] : SelectedFields<TSelection>>;"
		)
	})
})
