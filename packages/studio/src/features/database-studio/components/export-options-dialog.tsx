import { Button } from '@studio/shared/ui/button'
import { StudioDialog } from './studio-dialog'

export type ExportFormatChoice = 'json' | 'csv' | 'sql'

type Props = {
	open: boolean
	onOpenChange: (open: boolean) => void
	/** Format being exported (drives the title/labels only). */
	format: ExportFormatChoice
	/**
	 * Number of rows that match the active filters, when known (e.g. the current
	 * total count from the loaded table). Shown in the "matching rows" label.
	 */
	matchingRowCount?: number
	/** Runs the export honoring the active filters and sort. */
	onExportMatching: () => void
	/** Runs the export over the full table, ignoring filters (sort still applies). */
	onExportAll: () => void
}

const FORMAT_LABEL: Record<ExportFormatChoice, string> = {
	json: 'JSON',
	csv: 'CSV',
	sql: 'SQL INSERT'
}

export function ExportOptionsDialog({
	open,
	onOpenChange,
	format,
	matchingRowCount,
	onExportMatching,
	onExportAll
}: Props) {
	const label = FORMAT_LABEL[format]
	const matchingLabel =
		typeof matchingRowCount === 'number'
			? `Export ${matchingRowCount.toLocaleString()} matching rows`
			: 'Export matching rows'

	function handleMatching() {
		onOpenChange(false)
		onExportMatching()
	}

	function handleAll() {
		onOpenChange(false)
		onExportAll()
	}

	return (
		<StudioDialog
			open={open}
			onOpenChange={onOpenChange}
			title={`Export ${label}`}
			description='Filters are active on this table. Choose what to export.'
			footer={
				<div className='flex w-full flex-col gap-2 sm:flex-row sm:justify-end'>
					<Button variant='outline' onClick={handleAll}>
						Export all rows (ignore filters)
					</Button>
					<Button onClick={handleMatching}>{matchingLabel}</Button>
				</div>
			}
		>
			<p className='text-sm text-muted-foreground'>
				Exporting matching rows includes only the rows that satisfy your current filters and
				respects the active sort order. Choose “ignore filters” to export the entire table.
			</p>
		</StudioDialog>
	)
}
