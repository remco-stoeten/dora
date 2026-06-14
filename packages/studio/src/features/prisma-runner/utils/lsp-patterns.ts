/**
 * LSP autocomplete context detectors for Prisma Client queries.
 *
 * Mirrors the regex-driven approach used by the Drizzle runner, but models the
 * Prisma fluent API shape: prisma.<model>.<method>({ where: {...}, orderBy: {...} }).
 *
 * @see packages/studio/src/features/prisma-runner/components/code-editor.tsx
 * @see packages/studio/src/features/drizzle-runner/utils/lsp-patterns.ts
 */

export type PrismaContext =
	| { type: 'model-key' }
	| { type: 'method'; modelKey: string }
	| { type: 'where-field'; modelKey: string }
	| { type: 'field-operator'; modelKey: string; field: string }
	| { type: 'orderby-field'; modelKey: string }
	| { type: 'orderby-direction' }
	| { type: 'include-field'; modelKey: string }
	| { type: 'raw-method' }
	| { type: 'unknown' }

const MODEL_KEY = '[a-zA-Z_$][\\w$]*'
const FIELD = '[a-zA-Z_$][\\w$]*'

export function detectPrismaContext(lineBeforeCursor: string): PrismaContext {
	const text = lineBeforeCursor

	// prisma.$queryRaw / prisma.$executeRaw selection: prisma.$<partial>
	if (/\bprisma\.\$[\w]*$/.test(text)) {
		return { type: 'raw-method' }
	}

	// Inside an orderBy object, after `field: ` expecting 'asc' | 'desc'.
	if (new RegExp(`\\borderBy\\s*:\\s*\\{[^{}]*\\b${FIELD}\\s*:\\s*['"\`]?[\\w]*$`).test(text)) {
		return { type: 'orderby-direction' }
	}

	// Inside an orderBy object expecting a field key.
	const orderByModel = matchEnclosingClause(text, 'orderBy')
	if (orderByModel) {
		return { type: 'orderby-field', modelKey: orderByModel }
	}

	// Inside an include object expecting a relation key.
	const includeModel = matchEnclosingClause(text, 'include')
	if (includeModel) {
		return { type: 'include-field', modelKey: includeModel }
	}

	// Inside a where object: distinguish "field operator object" from "field key".
	const whereModel = matchEnclosingClause(text, 'where')
	if (whereModel) {
		// where: { email: { <partial> } } -> operator suggestions for `email`.
		const operatorMatch = text.match(
			new RegExp(`\\bwhere\\s*:\\s*\\{[\\s\\S]*?\\b(${FIELD})\\s*:\\s*\\{[^{}]*$`)
		)
		if (operatorMatch) {
			return { type: 'field-operator', modelKey: whereModel, field: operatorMatch[1] }
		}
		return { type: 'where-field', modelKey: whereModel }
	}

	// prisma.<model>.<partial-method> -> method names.
	const methodMatch = text.match(new RegExp(`\\bprisma\\.(${MODEL_KEY})\\.[\\w]*$`))
	if (methodMatch) {
		return { type: 'method', modelKey: methodMatch[1] }
	}

	// prisma.<partial> -> model keys.
	if (/\bprisma\.[\w$]*$/.test(text)) {
		return { type: 'model-key' }
	}

	return { type: 'unknown' }
}

/**
 * Finds the model key for a query whose cursor sits inside the named clause's
 * object literal (`where`, `orderBy`, `include`). The clause must be open (more
 * `{` than `}` since the clause start) so we only fire while the user is typing
 * inside it.
 */
function matchEnclosingClause(text: string, clause: string): string | null {
	const clauseRegex = new RegExp(`\\b${clause}\\s*:\\s*\\{`, 'g')
	let lastIndex = -1
	let match: RegExpExecArray | null
	while ((match = clauseRegex.exec(text)) !== null) {
		lastIndex = match.index + match[0].length
	}
	if (lastIndex === -1) return null

	const after = text.slice(lastIndex)
	const opens = (after.match(/\{/g) || []).length
	const closes = (after.match(/\}/g) || []).length
	if (closes > opens) return null

	const modelKey = extractModelKey(text.slice(0, lastIndex))
	return modelKey
}

function extractModelKey(text: string): string | null {
	const matches = Array.from(text.matchAll(new RegExp(`\\bprisma\\.(${MODEL_KEY})\\.`, 'g')))
	if (matches.length === 0) return null
	return matches[matches.length - 1][1]
}
