import { Binary } from 'lucide-react'
import { cn } from '@studio/shared/utils/cn'
import type { TBlobInfo } from './blob-utils'

type Props = {
	info: TBlobInfo
}

/**
 * Renders a binary/blob cell. Small blobs show as inline uppercase hex
 * (truncated with the cell's ellipsis), large blobs as a `<type — size>` chip.
 * Magic-byte type hints (e.g. "PNG image") are produced by the backend and just
 * displayed here. Cell actions (copy hex/base64, save) live in the cell context
 * menu, not on the renderer.
 */
export function BlobCell({ info }: Props) {
	if (info.kind === 'hex') {
		return (
			<span className='font-mono text-xs text-muted-foreground truncate' title={info.hex}>
				{info.hex}
			</span>
		)
	}

	return (
		<span
			className={cn(
				'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md',
				'bg-violet-500/10 text-violet-500 dark:text-violet-400 border border-violet-500/20',
				'font-mono text-[11px] font-medium tracking-wide max-w-full'
			)}
			title={info.label}
		>
			<Binary className='w-3 h-3 shrink-0' />
			<span className='truncate'>{info.label.replace(/^<|>$/g, '')}</span>
		</span>
	)
}
