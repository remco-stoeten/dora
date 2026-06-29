import { cn } from '@studio/shared/utils/cn'

type DiffTint = 'add' | 'change' | 'remove'

const TINT_DOT: Record<DiffTint, string> = {
	add: 'bg-emerald-500/45',
	change: 'bg-amber-500/45',
	remove: 'bg-red-500/45'
}

function Bar({ className }: { className?: string }) {
	return <div className={cn('h-2.5 rounded-full bg-foreground/10', className)} />
}

function SkeletonRow({ tint, nameWidth }: { tint: DiffTint; nameWidth: string }) {
	return (
		<div className='flex items-center gap-2.5 rounded-md border border-border/50 bg-card/40 px-3 py-2.5'>
			<span className={cn('h-2 w-2 shrink-0 rounded-full', TINT_DOT[tint])} />
			<Bar className={nameWidth} />
			<Bar className='ml-auto w-8 opacity-60' />
		</div>
	)
}

/**
 * A ghosted preview of the schema-diff table the cockpit renders once a project
 * is linked. It is purely decorative scaffolding for the empty state, so the
 * whole group is `aria-hidden` and a single sheen sweeps across it.
 */
export function CockpitEmptySkeleton() {
	return (
		<div
			className='cockpit-skeleton w-full max-w-sm select-none rounded-lg border border-border/50 bg-muted/20 p-3 opacity-70'
			aria-hidden
		>
			<div className='mb-3 flex items-center gap-2'>
				<Bar className='h-2 w-24' />
				<Bar className='ml-auto h-2 w-6 opacity-60' />
			</div>
			<div className='space-y-2'>
				<SkeletonRow tint='add' nameWidth='w-28' />
				<SkeletonRow tint='change' nameWidth='w-20' />
				<SkeletonRow tint='remove' nameWidth='w-24' />
			</div>
		</div>
	)
}
