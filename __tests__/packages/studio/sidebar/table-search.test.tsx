import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { TableSearch } from '@studio/features/sidebar/components/table-search'

const filters = {
	showTables: true,
	showViews: true,
	showMaterializedViews: true
}

describe('TableSearch', function () {
	it('shows the shared spinner on the refresh control while refreshing', function () {
		render(
			<TableSearch
				searchValue=''
				onSearchChange={vi.fn()}
				filters={filters}
				onFiltersChange={vi.fn()}
				onRefresh={vi.fn()}
				isRefreshing
			/>
		)

		const refreshButton = screen.getByRole('button', { name: /refresh tables/i })

		expect(refreshButton.querySelector('[role="status"]')).toBeTruthy()
		expect(refreshButton.querySelector('svg')).toBeNull()
	})
})
