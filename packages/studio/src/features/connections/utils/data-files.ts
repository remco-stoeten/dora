import type { DatabaseType } from '../types'

/** Flat-file extensions Dora can open as read-only DuckDB views. */
export const DATA_FILE_EXTENSIONS = [
	'csv',
	'tsv',
	'txt',
	'parquet',
	'pq',
	'json',
	'ndjson',
	'jsonl'
] as const

/** Unambiguous DuckDB database extensions. */
export const DUCKDB_FILE_EXTENSIONS = ['duckdb'] as const

/** SQLite-family extensions (safe to treat as SQLite without header probing). */
export const SQLITE_FILE_EXTENSIONS = [
	'sqlite',
	'sqlite2',
	'sqlite3',
	'db3',
	's3db',
	'sl3'
] as const

/** Compound SQLite extensions checked before the final segment. */
export const SQLITE_COMPOUND_EXTENSIONS = ['sqlite2.db'] as const

/** Shared `.db` extension — may be SQLite, libSQL local, or DuckDB. */
export const AMBIGUOUS_DATABASE_EXTENSIONS = ['db'] as const

/** All embedded database file extensions Dora recognizes on drop / pick. */
export const DATABASE_FILE_EXTENSIONS = [
	...DUCKDB_FILE_EXTENSIONS,
	...SQLITE_FILE_EXTENSIONS,
	...SQLITE_COMPOUND_EXTENSIONS,
	...AMBIGUOUS_DATABASE_EXTENSIONS
] as const

export type DatabaseFileKind = 'sqlite' | 'duckdb' | 'unknown'

export type DatabaseExtensionKind = DatabaseType | 'ambiguous' | null

export type ClassifiedDropPaths = {
	dataFiles: string[]
	databaseFiles: string[]
	unsupported: string[]
}

function basename(path: string): string {
	return path.split(/[\\/]/).pop() ?? path
}

export function extensionOf(path: string): string {
	const name = basename(path).toLowerCase()
	if (name.endsWith('.sqlite2.db')) return 'sqlite2.db'
	const dot = name.lastIndexOf('.')
	return dot >= 0 ? name.slice(dot + 1) : ''
}

function stemOf(path: string): string {
	const name = basename(path)
	const lower = name.toLowerCase()
	if (lower.endsWith('.sqlite2.db')) return name.slice(0, -'.sqlite2.db'.length)
	const dot = name.lastIndexOf('.')
	return dot > 0 ? name.slice(0, dot) : name
}

export function isDataFilePath(path: string): boolean {
	return (DATA_FILE_EXTENSIONS as readonly string[]).includes(extensionOf(path))
}

export function databaseTypeForExtension(path: string): DatabaseExtensionKind {
	const ext = extensionOf(path)
	if ((DUCKDB_FILE_EXTENSIONS as readonly string[]).includes(ext)) return 'duckdb'
	if ((SQLITE_COMPOUND_EXTENSIONS as readonly string[]).includes(ext)) return 'sqlite'
	if ((SQLITE_FILE_EXTENSIONS as readonly string[]).includes(ext)) return 'sqlite'
	if ((AMBIGUOUS_DATABASE_EXTENSIONS as readonly string[]).includes(ext)) return 'ambiguous'
	return null
}

export function isDatabaseFilePath(path: string): boolean {
	return databaseTypeForExtension(path) !== null
}

/** Extension-only mapping — use {@link resolveDatabaseTypeForPath} for `.db` files. */
export function databaseTypeForFile(path: string): DatabaseType {
	const kind = databaseTypeForExtension(path)
	if (kind === 'duckdb') return 'duckdb'
	return 'sqlite'
}

export function classifyDroppedPaths(paths: string[]): ClassifiedDropPaths {
	const dataFiles: string[] = []
	const databaseFiles: string[] = []
	const unsupported: string[] = []

	for (const path of paths) {
		if (isDataFilePath(path)) {
			dataFiles.push(path)
		} else if (isDatabaseFilePath(path)) {
			databaseFiles.push(path)
		} else {
			unsupported.push(path)
		}
	}

	return { dataFiles, databaseFiles, unsupported }
}

export function connectionNameFromPath(path: string): string {
	return stemOf(path)
}

export async function resolveDatabaseTypeForPath(
	path: string,
	probe: (path: string) => Promise<DatabaseFileKind>
): Promise<DatabaseType> {
	const extKind = databaseTypeForExtension(path)
	if (extKind === 'duckdb' || extKind === 'sqlite') return extKind
	if (extKind === 'ambiguous') {
		const kind = await probe(path)
		if (kind === 'duckdb') return 'duckdb'
	}
	return 'sqlite'
}

/**
 * Names a data-file connection: the single file's stem, or "<first> +N more"
 * when several files are opened together.
 */
export function deriveDataFileName(paths: string[]): string {
	if (paths.length === 0) return 'Data files'
	const first = stemOf(paths[0])
	return paths.length === 1 ? first : `${first} +${paths.length - 1} more`
}

export function buildConnectionFromDatabaseFile(
	path: string,
	type: DatabaseType
): Omit<import('../types').Connection, 'id' | 'status' | 'createdAt'> {
	return {
		name: connectionNameFromPath(path),
		type,
		url: path
	}
}

export function buildConnectionFromDataFiles(
	paths: string[]
): Omit<import('../types').Connection, 'id' | 'status' | 'createdAt'> {
	return {
		name: deriveDataFileName(paths),
		type: 'duckdb',
		url: ':memory:',
		fileSources: paths
	}
}
