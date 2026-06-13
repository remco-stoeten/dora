import type { DockerContainer } from '../types'
import { getContainerConnectionDetails } from './container-connection'

export type SnippetLanguage = 'terminal' | 'nodejs' | 'python' | 'prisma'

export function generateSnippet(container: DockerContainer, language: SnippetLanguage): string {
	const connection = getContainerConnectionDetails(container)
	const url = connection.connectionUrl

	switch (language) {
		case 'terminal':
			if (connection.provider === 'mariadb') {
				return connection.password
					? `mysql -h ${connection.host} -P ${connection.port} -u ${connection.user} -p${connection.password} ${connection.database}`
					: `mysql -h ${connection.host} -P ${connection.port} -u ${connection.user} ${connection.database}`
			}

			if (connection.provider === 'cockroach') {
				return `cockroach sql --insecure --host=${connection.host}:${connection.port} --database ${connection.database}`
			}

			return `PGPASSWORD='${connection.password}' psql -h ${connection.host} -p ${connection.port} -U ${connection.user} -d ${connection.database}`

		case 'nodejs':
			if (connection.provider === 'mariadb') {
				return `import mysql from 'mysql2/promise';

const connection = await mysql.createConnection({
  host: '${connection.host}',
  port: ${connection.port},
  user: '${connection.user}',
  password: '${connection.password}',
  database: '${connection.database}'
});

await connection.connect();
console.log('Connected!');`
			}

			return `import { Client } from 'pg';

const client = new Client({
  connectionString: '${url}'
});

await client.connect();
console.log('Connected!');`

		case 'python':
			if (connection.provider === 'mariadb') {
				return `import mysql.connector

conn = mysql.connector.connect(
    host="${connection.host}",
    port=${connection.port},
    user="${connection.user}",
    password="${connection.password}",
    database="${connection.database}",
)
cur = conn.cursor()
print("Connected!")`
			}

			return `import psycopg2

conn = psycopg2.connect("${url}")
cur = conn.cursor()
print("Connected!")`

		case 'prisma':
			return `datasource db {
  provider = "${connection.provider === 'mariadb' ? 'mysql' : 'postgresql'}"
  url      = "${url}"
}`

		default:
			return url
	}
}
