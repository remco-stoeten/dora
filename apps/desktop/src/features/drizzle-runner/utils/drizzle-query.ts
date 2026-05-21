function trimTrailingSemicolon(value: string): string {
	return value.trim().replace(/;\s*$/, '').trim()
}

function stripLeadingComments(value: string): string {
	let next = value.trim()
	let changed = true

	while (changed) {
		changed = false
		const withoutLineComment = next.replace(/^\/\/[^\n]*(?:\n|$)/, '').trim()
		if (withoutLineComment !== next) {
			next = withoutLineComment
			changed = true
			continue
		}

		const withoutBlockComment = next.replace(/^\/\*[\s\S]*?\*\//, '').trim()
		if (withoutBlockComment !== next) {
			next = withoutBlockComment
			changed = true
		}
	}

	return next
}

function normalizeTableExpression(expression: string): string | undefined {
	const trimmed = expression.trim()
	const unwrapped =
		(trimmed.startsWith('"') && trimmed.endsWith('"')) ||
		(trimmed.startsWith("'") && trimmed.endsWith("'")) ||
		(trimmed.startsWith('`') && trimmed.endsWith('`'))
			? trimmed.slice(1, -1)
			: trimmed

	const parts = unwrapped.split('.').map(function (part) {
		return part.trim()
	})

	if (
		parts.length === 0 ||
		parts.length > 2 ||
		parts.some(function (part) {
			return !/^[A-Za-z_][\w$]*$/.test(part)
		})
	) {
		return undefined
	}

	return parts.join('.')
}

/**
 * Converts a Drizzle ORM query expression to a plain SQL string.
 *
 * Supported patterns:
 *   - sql`SELECT ...`
 *   - db.execute(sql`SELECT ...`)
 *   - tx.execute(sql`SELECT ...`)
 *   - db.execute('SELECT ...')
 *   - (db|tx).select().from(table) [optional .limit(n), .offset(n)]
 *
 * Unsupported patterns (e.g. .where(), .orderBy(), .join()) throw explicit
 * messages directing users to use db.execute(sql`...`).
 */
export function drizzleQueryToSql(source: string): string {
	const query = trimTrailingSemicolon(stripLeadingComments(source))
	if (!query) {
		throw new Error('Enter a Drizzle query to execute.')
	}

	const rawSqlMatch = query.match(
		/^(?:await\s+)?(?:(?:db|tx)\.execute\s*\(\s*)?sql`([\s\S]*)`\s*\)?$/
	)
	if (rawSqlMatch) {
		return rawSqlMatch[1].trim()
	}

	const executePlainSqlMatch = query.match(
		/^(?:await\s+)?(?:db|tx)\.execute\s*\(\s*(['"`])([\s\S]*)\1\s*\)$/
	)
	if (executePlainSqlMatch) {
		return executePlainSqlMatch[2].trim()
	}

	const simpleSelectMatch = query.match(
		/^(?:await\s+)?(?:db|tx)\.select\s*\(\s*\)\s*\.from\s*\(\s*([^)]+?)\s*\)([\s\S]*)$/
	)
	if (simpleSelectMatch) {
		const tableName = normalizeTableExpression(simpleSelectMatch[1])
		if (!tableName) {
			throw new Error(
				'Unsupported Drizzle table expression. Use a simple table name ' +
				'(e.g. users, schema.users). For quoted or multi-part names, ' +
				'use db.execute(sql`...`).'
			)
		}

		const chain = simpleSelectMatch[2].trim()

		if (/\.where\s*\(/i.test(chain)) {
			throw new Error(
				'Queries with .where() are not auto-translated. ' +
				'Use db.execute(sql`...`) instead.'
			)
		}
		if (/\.orderBy\s*\(/i.test(chain)) {
			throw new Error(
				'Queries with .orderBy() are not auto-translated. ' +
				'Use db.execute(sql`...`) instead.'
			)
		}

		const unsupportedChain = chain
			.replace(/\.limit\s*\(\s*\d+\s*\)/g, '')
			.replace(/\.offset\s*\(\s*\d+\s*\)/g, '')
			.trim()

		if (unsupportedChain) {
			throw new Error(
				'Unsupported Drizzle query. Currently supported: sql`...`, ' +
				'(db|tx).execute(sql`...`), (db|tx).select().from(table) with ' +
				'optional .limit(n) and .offset(n), without where/join clauses. ' +
				'For more complex queries, use db.execute(sql`...`).'
			)
		}

		const limitMatch = chain.match(/\.limit\s*\(\s*(\d+)\s*\)/)
		const offsetMatch = chain.match(/\.offset\s*\(\s*(\d+)\s*\)/)
		let sql = `SELECT * FROM ${tableName}`
		if (limitMatch) sql += ` LIMIT ${limitMatch[1]}`
		if (offsetMatch) sql += ` OFFSET ${offsetMatch[1]}`
		return sql
	}

	throw new Error(
		'Unsupported Drizzle query. Currently supported: ' +
		'sql`...`, (db|tx).execute(sql`...`), ' +
		'(db|tx).select().from(table) with optional .limit(n) and .offset(n), ' +
		'without where/orderBy/join clauses. ' +
		'For more complex queries, use db.execute(sql`...`).'
	)
}
