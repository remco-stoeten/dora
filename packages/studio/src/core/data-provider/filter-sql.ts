import type {
	FilterConjunction,
	FilterDescriptor,
	FilterOperator
} from '@studio/features/database-studio/types'

/** Maps a filter operator to its SQL representation. */
export function operatorToSql(op: FilterOperator | string): string {
	const map: Record<string, string> = {
		eq: '=',
		neq: '!=',
		gt: '>',
		gte: '>=',
		lt: '<',
		lte: '<=',
		ilike: 'ILIKE',
		contains: 'LIKE'
	}
	return map[op] || '='
}

/** Builds the SQL condition for a single filter, with the value escaped. */
export function buildFilterCondition(filter: FilterDescriptor): string {
	const sqlOp = operatorToSql(filter.operator)
	const escapedValue = String(filter.value).replace(/'/g, "''")
	if (filter.operator === 'contains' || filter.operator === 'ilike') {
		return `"${filter.column}" ${sqlOp} '%${escapedValue}%'`
	}
	return `"${filter.column}" ${sqlOp} '${escapedValue}'`
}

/**
 * Builds a WHERE clause body (without the leading `WHERE`) from a flat list of
 * filters joined by the given conjunction. Returns an empty string when there
 * are no filters.
 */
export function buildWhereClause(
	filters: FilterDescriptor[] | undefined,
	conjunction: FilterConjunction = 'AND'
): string {
	if (!filters || filters.length === 0) return ''
	return filters.map(buildFilterCondition).join(` ${conjunction} `)
}
