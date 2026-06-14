import { cn } from '@studio/shared/utils/cn'

const SHIMMER_LINES = ['w-[92%]', 'w-[78%]', 'w-[54%]'] as const

type Props = {
	label?: string
	className?: string
	compact?: boolean
}

export function AiThinkingIndicator({
	label = 'Thinking…',
	className,
	compact = false,
}: Props) {
	return (
		<div
			className={cn('py-0.5', className)}
			role='status'
			aria-live='polite'
			aria-label={label}
		>
			<div className={cn('space-y-1.5', compact && 'space-y-1')}>
				{SHIMMER_LINES.map(function (widthClass, index) {
					return (
						<div
							key={index}
							className={cn(
								'async-count-shimmer rounded-full',
								compact ? 'h-2' : 'h-2.5',
								widthClass
							)}
							style={{ animationDelay: `${index * 120}ms` }}
						/>
					)
				})}
			</div>
			<p
				className={cn(
					'ai-thinking-label mt-2 text-[11px] font-medium tracking-wide',
					compact && 'mt-1.5 text-[10px]'
				)}
			>
				{label}
			</p>
		</div>
	)
}
