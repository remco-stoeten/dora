import { Badge } from '@studio/shared/ui/badge'
import { Button } from '@studio/shared/ui/button'
import { cn } from '@studio/shared/utils/cn'
import type { DataFileSourceEntry } from '@studio/features/connections/types/data-file-source'
import { dataFileSourceStatusLabel } from '@studio/features/connections/types/data-file-source'
import type { DataFileHealth } from '@studio/features/connections/data-file-health'
import { DataFileHealthIndicator } from '@studio/features/connections/components/data-file-health-indicator'
import { FileWarning, FolderSearch, Lock, RefreshCw, Trash2 } from 'lucide-react'
import type { ReactNode } from 'react'

type RecoveryActions = {
	onRemove?: (path: string) => void
	onRelocate?: (path: string) => void
	onRetry?: () => void
	isRecovering?: boolean
}

type Props = {
	entries: DataFileSourceEntry[]
	isReadonly?: boolean
	selectedTableName?: string | null
	className?: string
	health?: DataFileHealth | null
	headerActions?: ReactNode
} & RecoveryActions

function statusBadgeClass(status: DataFileSourceEntry['status']): string {
	switch (status) {
		case 'active':
			return 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
		case 'missing':
			return 'border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300'
		case 'failed':
			return 'border-destructive/30 bg-destructive/10 text-destructive'
		default:
			return ''
	}
}

export function DataFileSourcePanel({
	entries,
	isReadonly = true,
	selectedTableName,
	className,
	health,
	headerActions,
	onRemove,
	onRelocate,
	onRetry,
	isRecovering = false,
}: Props) {
	const hasIssues = entries.some(function (entry) {
		return entry.status !== 'active'
	})
	const canRemove = entries.length > 1

	return (
		<section
			aria-label='Data file sources'
			className={cn(
				'border-b border-border/60 bg-background/80 px-4 py-3',
				className
			)}
		>
			<div className='mb-2 flex items-center justify-between gap-2'>
				<h3 className='text-xs font-medium uppercase tracking-wide text-muted-foreground'>
					Data file sources
				</h3>
				<div className='flex flex-wrap items-center gap-2'>
					{health && <DataFileHealthIndicator health={health} compact />}
					{headerActions}
					{hasIssues && onRetry && (
						<Button
							type='button'
							variant='outline'
							size='sm'
							className='h-7 gap-1 px-2 text-xs'
							disabled={isRecovering}
							onClick={onRetry}
						>
							<RefreshCw className={cn('h-3 w-3', isRecovering && 'animate-spin')} aria-hidden />
							Retry registration
						</Button>
					)}
					{isReadonly && (
						<Badge variant='outline' className='gap-1 font-normal text-muted-foreground'>
							<Lock className='h-3 w-3' aria-hidden />
							Readonly
						</Badge>
					)}
				</div>
			</div>

			{hasIssues && (
				<div className='mb-3 flex items-start gap-2 rounded-md border border-amber-500/30 bg-amber-500/5 px-3 py-2 text-xs text-amber-800 dark:text-amber-200'>
					<FileWarning className='mt-0.5 h-3.5 w-3.5 shrink-0' aria-hidden />
					<p>
						Some files could not be registered. Active views remain queryable; fix or
						remove problem files below.
					</p>
				</div>
			)}

			<ul className='space-y-2'>
				{entries.map(function (entry) {
					const isSelected =
						selectedTableName != null &&
						selectedTableName.toLowerCase() === entry.viewName.toLowerCase()
					const showRecovery = entry.status !== 'active'

					return (
						<li
							key={entry.path}
							className={cn(
								'rounded-md border px-3 py-2 text-xs',
								isSelected
									? 'border-primary/30 bg-primary/5'
									: 'border-border/70 bg-muted/20'
							)}
						>
							<div className='flex flex-wrap items-center gap-2'>
								<span className='font-medium text-foreground'>{entry.fileType}</span>
								<span className='text-muted-foreground'>→</span>
								<code className='rounded bg-background px-1.5 py-0.5 text-[11px] text-foreground'>
									{entry.viewName}
								</code>
								<Badge
									variant='outline'
									className={cn('font-normal', statusBadgeClass(entry.status))}
								>
									{dataFileSourceStatusLabel(entry.status)}
								</Badge>
								{isSelected && entry.status === 'active' && (
									<Badge variant='secondary' className='font-normal'>
										Active view
									</Badge>
								)}
							</div>
							<p className='mt-1 break-all font-mono text-[11px] text-muted-foreground'>
								{entry.path}
							</p>
							{entry.error && entry.status !== 'active' && (
								<p className='mt-1 text-[11px] text-destructive/90'>{entry.error}</p>
							)}
							{showRecovery && (
								<div className='mt-2 flex flex-wrap gap-2'>
									{onRelocate && (
										<Button
											type='button'
											variant='outline'
											size='sm'
											className='h-7 gap-1 px-2 text-xs'
											disabled={isRecovering}
											onClick={function () {
												onRelocate(entry.path)
											}}
										>
											<FolderSearch className='h-3 w-3' aria-hidden />
											Locate file
										</Button>
									)}
									{onRemove && canRemove && (
										<Button
											type='button'
											variant='outline'
											size='sm'
											className='h-7 gap-1 px-2 text-xs text-destructive hover:text-destructive'
											disabled={isRecovering}
											onClick={function () {
												onRemove(entry.path)
											}}
										>
											<Trash2 className='h-3 w-3' aria-hidden />
											Remove source
										</Button>
									)}
								</div>
							)}
						</li>
					)
				})}
			</ul>
		</section>
	)
}
