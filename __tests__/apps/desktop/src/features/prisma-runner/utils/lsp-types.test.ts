import { describe, expect, it } from 'vitest'
import type { ColumnInfo, DatabaseSchema, TableInfo } from '@/lib/bindings'
import { generatePrismaTypes } from '@/features/prisma-runner/utils/lsp-types'
import { buildModelMap } from '@/features/prisma-runner/utils/model-mapper'

function col(name: string, overrides: Partial<ColumnInfo> = {}): ColumnInfo {
	return {
		name,
		data_type: 'text',
		is_nullable: true,
		default_value: null,
		...overrides
	}
}

function table(name: string, columns: ColumnInfo[], pk: string[] = ['id']): TableInfo {
	return { name, schema: 'public', columns, primary_key_columns: pk }
}

const buildSchema: DatabaseSchema = {
	tables: [
		table('users', [
			col('id', { data_type: 'integer', is_nullable: false, is_primary_key: true }),
			col('email'),
			col('age', { data_type: 'integer' }),
			col('active', { data_type: 'boolean' }),
			col('created_at', { data_type: 'timestamp' })
		]),
		table('posts', [
			col('id', { data_type: 'integer', is_nullable: false, is_primary_key: true }),
			col('title'),
			col('author_id', {
				data_type: 'integer',
				foreign_key: {
					referenced_table: 'users',
					referenced_column: 'id',
					referenced_schema: 'public'
				}
			})
		])
	],
	schemas: ['public'],
	unique_columns: []
}

const modelMap = buildModelMap(buildSchema)

describe('generatePrismaTypes', function () {
	const types = generatePrismaTypes(buildSchema, modelMap)

	it('emits a WhereInput interface per model with logical operators', function () {
		expect(types).toContain('interface UserWhereInput {')
		expect(types).toContain('AND?: UserWhereInput | UserWhereInput[];')
		expect(types).toContain('OR?: UserWhereInput[];')
		expect(types).toContain('NOT?: UserWhereInput')
	})

	it('types where columns with operator overloads', function () {
		expect(types).toContain('email?: string | PrismaStringFilter;')
		expect(types).toContain('age?: number | PrismaNumberFilter;')
		expect(types).toContain('active?: boolean | PrismaBooleanFilter;')
		expect(types).toContain('created_at?: Date | string | PrismaDateFilter;')
	})

	it('emits a SelectInput with every column as boolean', function () {
		expect(types).toContain('interface UserSelectInput {')
		expect(types).toContain('email?: boolean;')
	})

	it('emits an IncludeInput with FK relation keys', function () {
		expect(types).toContain('interface PostIncludeInput {')
		expect(types).toContain('user?: boolean;')
	})

	it('emits an OrderByInput with asc/desc directions', function () {
		expect(types).toContain('interface UserOrderByInput {')
		expect(types).toContain("email?: 'asc' | 'desc';")
	})

	it('emits a Delegate with the supported methods', function () {
		expect(types).toContain('interface UserDelegate {')
		for (const method of [
			'findMany',
			'findFirst',
			'findUnique',
			'create',
			'createMany',
			'update',
			'updateMany',
			'delete',
			'deleteMany',
			'count'
		]) {
			expect(types).toContain(`${method}(`)
		}
	})

	it('declares the prisma client with model delegates and raw methods', function () {
		expect(types).toContain('declare const prisma: {')
		expect(types).toContain('user: UserDelegate;')
		expect(types).toContain('post: PostDelegate;')
		expect(types).toContain('$queryRaw(strings: TemplateStringsArray')
		expect(types).toContain('$executeRaw(strings: TemplateStringsArray')
	})
})
