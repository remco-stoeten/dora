import type { DatabaseType } from './types'

export type DbEngine = DatabaseType

export type DbPreset =
	| 'postgres'
	| 'neon'
	| 'supabase'
	| 'cockroach'
	| 'mysql'
	| 'mariadb'
	| 'planetscale'
	| 'sqlite'
	| 'duckdb'
	| 'libsql'
	| 'turso'
	| 'generic'

export type SourceKind = 'sql-server' | 'cloud-preset' | 'embedded-database' | 'data-file'

export type SourceMeta = {
	kind: SourceKind
	engine: DbEngine
	preset: DbPreset
	isDataFileSession: boolean
}
