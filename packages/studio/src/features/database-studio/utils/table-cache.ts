import { getTableRefParts } from '@studio/shared/utils/table-ref'
import type { SortDescriptor, FilterDescriptor, FilterConjunction, FilterGroup } from '../types'

export function buildTableCacheKey(
	connectionId: string | undefined,
	tableId: string | null,
	limit: number,
	offset: number,
	sort: SortDescriptor | undefined,
	filters: FilterDescriptor[],
	conjunction: FilterConjunction = 'AND',
	filterGroup?: FilterGroup
) {
	return JSON.stringify({
		connectionId: connectionId || '',
		tableId: tableId || '',
		limit,
		offset,
		sort: sort || null,
		filters,
		conjunction,
		filterGroup: filterGroup || null
	})
}

export function schemaHasTable(
	schema: { tables: Array<{ name: string; schema?: string | null }> },
	tableRef: string
) {
	const { tableName, schemaName } = getTableRefParts(tableRef)
	return schema.tables.some(function (table) {
		if (table.name !== tableName) return false
		if (!schemaName) return true
		return table.schema === schemaName
	})
}
