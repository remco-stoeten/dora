import { Sparkles, User } from 'lucide-react'
import { memo } from 'react'
import { cn } from '@studio/shared/utils/cn'
import { MessageContent } from './message-content'
import type { ChatMessage } from './types'

type Props = {
	message: ChatMessage
	activeConnectionId: string | null
	onEditorInsert?: (sql: string) => void
	onRunInConsole?: (sql: string) => void
}

export const MessageBubble = memo(function MessageBubble({
	message,
	activeConnectionId,
	onEditorInsert,
	onRunInConsole
}: Props) {
	const isUser = message.role === 'user'

	return (
		<div className={cn('flex gap-2 px-3 py-2', isUser ? 'bg-sidebar-accent/30' : '')}>
			<div className='mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-sidebar-border'>
				{isUser ? (
					<User className='h-3 w-3 text-muted-foreground' />
				) : (
					<Sparkles className='h-3 w-3 text-primary' />
				)}
			</div>

			<div className='min-w-0 flex-1'>
				{isUser ? (
					<div className='whitespace-pre-wrap text-sm leading-relaxed text-foreground'>
						{message.content}
					</div>
				) : (
					<div className='prose prose-invert max-w-none text-sm'>
						<MessageContent
							content={message.content || (message.streaming ? '' : '')}
							isStreaming={message.streaming}
							activeConnectionId={activeConnectionId}
							onEditorInsert={onEditorInsert}
							onRunInConsole={onRunInConsole}
						/>
					</div>
				)}
				{message.error && (
					<div className='mt-1 rounded border border-red-500/40 bg-red-500/10 px-2 py-1 text-[11px] text-red-400'>
						{message.error}
					</div>
				)}
				{message.streaming && !message.error && message.content.trim().length > 0 && (
					<span
						aria-hidden
						className='ml-0.5 inline-block h-3.5 w-[2px] animate-pulse rounded-full bg-primary/80 align-middle'
					/>
				)}
			</div>
		</div>
	)
})
