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

export function drizzleQueryToSql(source: string): string {
	const query = trimTrailingSemicolon(stripLeadingComments(source))
	if (!query) {
		throw new Error('Enter a Drizzle query to execute.')
	}

	const rawSqlMatch = query.match(
		/^(?:await\s+)?(?:db\.execute\s*\(\s*)?sql`([\s\S]*)`\s*\)?$/
	)
	if (rawSqlMatch) {
		return rawSqlMatch[1].trim()
	}

	const executePlainSqlMatch = query.match(
		/^(?:await\s+)?db\.execute\s*\(\s*(['"`])([\s\S]*)\1\s*\)$/
	)
	if (executePlainSqlMatch) {
		return executePlainSqlMatch[2].trim()
	}

	const simpleSelectMatch = query.match(
		/^(?:await\s+)?db\.select\s*\(\s*\)\s*\.from\s*\(\s*([^)]+?)\s*\)([\s\S]*)$/
	)
	if (simpleSelectMatch) {
		const tableName = normalizeTableExpression(simpleSelectMatch[1])
		if (!tableName) {
			throw new Error('Unsupported Drizzle table expression. Use a simple table name.')
		}

		const chain = simpleSelectMatch[2].trim()
		const unsupportedChain = chain.replace(/\.limit\s*\(\s*\d+\s*\)/g, '').trim()
		if (unsupportedChain) {
			throw new Error(
				'Unsupported Drizzle query. Use db.execute(sql`...`) for custom SQL or a simple select/from/limit query.'
			)
		}

		const limitMatch = chain.match(/\.limit\s*\(\s*(\d+)\s*\)/)
		return `SELECT * FROM ${tableName}${limitMatch ? ` LIMIT ${limitMatch[1]}` : ''}`
	}

	throw new Error(
		'Unsupported Drizzle query. Use db.execute(sql`...`) for custom SQL or db.select().from(table).limit(n).'
	)
}
