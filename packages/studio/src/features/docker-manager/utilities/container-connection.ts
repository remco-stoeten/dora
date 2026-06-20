import type { DatabaseType } from '@studio/features/connections/types'
import type { DatabaseProvider, DockerContainer } from '../types'

export type ContainerConnectionDetails = {
	provider: DatabaseProvider
	/**
	 * The connection type to open in the data viewer. Unlike `provider` (which is
	 * limited to the engines we can spin up locally), this distinguishes plain
	 * MySQL from MariaDB so the backend dialect and SQL generation are correct.
	 */
	type: DatabaseType
	host: string
	port: number
	user: string
	password: string
	database: string
	connectionUrl: string
}

/**
 * Detects the concrete database engine of a container from its image name.
 * Recognises MySQL/Percona separately from MariaDB so the data viewer connects
 * with the right driver instead of falling back to Postgres.
 */
export function detectConnectionType(container: DockerContainer): DatabaseType {
	const image = `${container.image}:${container.imageTag}`.toLowerCase()

	if (image.includes('cockroach')) return 'cockroach'
	if (image.includes('mariadb')) return 'mariadb'
	if (image.includes('mysql') || image.includes('percona')) return 'mysql'
	return 'postgres'
}

export function detectDatabaseProvider(container: DockerContainer): DatabaseProvider {
	const type = detectConnectionType(container)

	if (type === 'mariadb') return 'mariadb'
	if (type === 'mysql') return 'mysql'
	if (type === 'cockroach') return 'cockroach'
	return 'postgres'
}

// MySQL and MariaDB are wire-compatible; they share port, env-var, URL and
// CLI-snippet handling. Use this guard wherever that shared path applies.
function isMysqlFamily(provider: DatabaseProvider): boolean {
	return provider === 'mariadb' || provider === 'mysql'
}

export function getPrimaryDatabasePort(container: DockerContainer): number {
	const provider = detectDatabaseProvider(container)

	if (isMysqlFamily(provider)) {
		return container.ports.find((port) => port.containerPort === 3306)?.hostPort ?? 3306
	}

	if (provider === 'cockroach') {
		return container.ports.find((port) => port.containerPort === 26257)?.hostPort ?? 26257
	}

	return container.ports.find((port) => port.containerPort === 5432)?.hostPort ?? 5432
}

function readEnvValue(container: DockerContainer, keys: string[], fallback: string): string {
	for (const key of keys) {
		const value = container.env.find((entry) => entry.startsWith(`${key}=`))?.split('=')[1]
		if (value) return value
	}

	return fallback
}

function buildUrl(
	provider: DatabaseProvider,
	host: string,
	port: number,
	user: string,
	password: string,
	database: string
): string {
	if (isMysqlFamily(provider)) {
		const auth = password
			? `${encodeURIComponent(user)}:${encodeURIComponent(password)}`
			: encodeURIComponent(user)
		return `mysql://${auth}@${host}:${port}/${database}`
	}

	const auth = password
		? `${encodeURIComponent(user)}:${encodeURIComponent(password)}`
		: encodeURIComponent(user)

	if (provider === 'cockroach' && !password) {
		return `postgresql://${auth}@${host}:${port}/${database}?sslmode=disable`
	}

	return `postgresql://${auth}@${host}:${port}/${database}`
}

export function getContainerConnectionDetails(
	container: DockerContainer
): ContainerConnectionDetails {
	const provider = detectDatabaseProvider(container)
	const type = detectConnectionType(container)
	const host = 'localhost'
	const port = getPrimaryDatabasePort(container)

	if (isMysqlFamily(provider)) {
		// Covers both MariaDB (MARIADB_*) and MySQL (MYSQL_*) images.
		const user = readEnvValue(
			container,
			['MARIADB_USER', 'MYSQL_USER', 'MARIADB_ROOT_USER'],
			'root'
		)
		const password = readEnvValue(
			container,
			['MARIADB_PASSWORD', 'MYSQL_PASSWORD', 'MARIADB_ROOT_PASSWORD', 'MYSQL_ROOT_PASSWORD'],
			'rootpass'
		)
		const database = readEnvValue(container, ['MARIADB_DATABASE', 'MYSQL_DATABASE'], 'dora')

		return {
			provider,
			type,
			host,
			port,
			user,
			password,
			database,
			connectionUrl: buildUrl(provider, host, port, user, password, database)
		}
	}

	if (provider === 'cockroach') {
		const user = readEnvValue(container, ['COCKROACH_USER', 'POSTGRES_USER'], 'root')
		const database = readEnvValue(container, ['COCKROACH_DATABASE', 'POSTGRES_DB'], 'defaultdb')

		return {
			provider,
			type,
			host,
			port,
			user,
			password: '',
			database,
			connectionUrl: buildUrl(provider, host, port, user, '', database)
		}
	}

	const user = readEnvValue(container, ['POSTGRES_USER'], 'postgres')
	const password = readEnvValue(container, ['POSTGRES_PASSWORD'], 'postgres')
	const database = readEnvValue(container, ['POSTGRES_DB'], 'postgres')

	return {
		provider,
		type,
		host,
		port,
		user,
		password,
		database,
		connectionUrl: buildUrl(provider, host, port, user, password, database)
	}
}
