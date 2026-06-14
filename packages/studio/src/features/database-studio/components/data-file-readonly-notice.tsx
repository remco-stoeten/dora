import { DATA_FILE_READONLY_MESSAGE } from '@studio/features/connections/source-labels'

export function DataFileReadonlyNotice() {
	return (
		<div
			role='note'
			className='border-b border-border/60 bg-muted/30 px-4 py-2 text-xs leading-relaxed text-muted-foreground'
		>
			{DATA_FILE_READONLY_MESSAGE}
		</div>
	)
}
