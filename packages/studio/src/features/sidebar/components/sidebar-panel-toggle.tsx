import { PanelLeft } from 'lucide-react'
import { Button } from '@studio/shared/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@studio/shared/ui/tooltip'
import { cn } from '@studio/shared/utils/cn'

type Props = {
	isOpen?: boolean
	onToggle?: () => void
	className?: string
	buttonClassName?: string
	tooltip?: string
}

export function SidebarPanelToggle({
	isOpen = true,
	onToggle,
	className,
	buttonClassName,
	tooltip = 'Toggle sidebar (Ctrl+B)'
}: Props) {
	if (!onToggle) return null

	return (
		<Tooltip>
			<TooltipTrigger asChild>
				<Button
					variant='ghost'
					size='icon'
					className={cn(
						'h-6 w-6 text-muted-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent',
						buttonClassName
					)}
					onClick={onToggle}
					aria-label={tooltip}
					aria-pressed={isOpen}
				>
					<PanelLeft
						className={cn(
							'h-4 w-4 transition-transform duration-300',
							!isOpen && 'rotate-180',
							className
						)}
					/>
				</Button>
			</TooltipTrigger>
			<TooltipContent side='top' className='text-xs'>
				{tooltip}
			</TooltipContent>
		</Tooltip>
	)
}
