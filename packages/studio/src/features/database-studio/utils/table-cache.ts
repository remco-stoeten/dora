import { getTableRefParts } from '@studio/shared/utils/table-ref'
import { tableDataCache } from '@studio/core/table-cache'
import type { DataAdapter } from '@studio/core/data-provider/types'
import type { SortDescriptor, FilterDescriptor, FilterConjunction, FilterGroup } from '../types'
import { enrichColumnsWithFKs } from './fk-enrichment'

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

// The default page (no sort/filters) the studio loads when a table is first
// opened. Mirrors the initial `pagination`/`sort`/`filterGroup` state in
// DatabaseStudio so the key produced here matches the one `loadTableData` writes
// under — otherwise the instant-paint lookups always miss and the skeleton
// flashes even for already-cached tables.
const EMPTY_FILTER_GROUP: FilterGroup = { logic: 'AND', conditions: [] }

export function buildDefaultTableCacheKey(
	connectionId: string | undefined,
	tableId: string | null
) {
	return buildTableCacheKey(connectionId, tableId, 50, 0, undefined, [], 'AND', EMPTY_FILTER_GROUP)
}

const inFlightPrefetches = new Set<string>()

// Best-effort warm of a table's default page into `tableDataCache`, so opening
// the table from the sidebar is an instant cache hit instead of a fetch +
// skeleton. Replicates the fetch + FK-enrichment that `loadTableData` performs
// and stores under the same key. Safe to call repeatedly: cached and in-flight
// tables are skipped, and failures are swallowed (the real load surfaces errors).
export async function prefetchTableData(
	adapter: DataAdapter,
	connectionId: string | undefined,
	tableRefName: string | null
) {
	if (!connectionId || !tableRefName) return

	const key = buildDefaultTableCacheKey(connectionId, tableRefName)
	if (tableDataCache.has(key) || inFlightPrefetches.has(key)) return

	inFlightPrefetches.add(key)
	try {
		const result = await adapter.fetchTableData(
			connectionId,
			tableRefName,
			0,
			50,
			undefined,
			[],
			'AND',
			EMPTY_FILTER_GROUP
		)
		if (!result.ok) return

		const data = result.data
		const schemaResult = await adapter.getSchema(connectionId)
		if (schemaResult.ok) {
			const { tableName, schemaName } = getTableRefParts(tableRefName)
			data.columns = enrichColumnsWithFKs(
				data.columns,
				schemaResult.data,
				tableName,
				schemaName ?? undefined
			)
		}

		if (!tableDataCache.has(key)) {
			tableDataCache.set(key, {
				data,
				visibleColumns: data.columns.map(function (c) {
					return c.name
				})
			})
		}
	} catch {
		// Prefetch is best-effort; ignore failures.
	} finally {
		inFlightPrefetches.delete(key)
	}
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
