import type { AiAssistantContext, ChatMessage } from './types'

function formatViewName(view: string | undefined): string | null {
	if (!view) return null
	return view
		.split('-')
		.map(function (part) {
			return part.charAt(0).toUpperCase() + part.slice(1)
		})
		.join(' ')
}

function buildContextBlock(context: AiAssistantContext | undefined): string {
	if (!context) return ''

	const lines: string[] = ['Current Dora UI context:']
	const viewName = formatViewName(context.activeView)
	if (viewName) lines.push(`- Active view: ${viewName}`)
	if (context.activeConnectionId) lines.push(`- Active connection id: ${context.activeConnectionId}`)
	if (context.selectedTableId) lines.push(`- Selected table id: ${context.selectedTableId}`)
	if (context.selectedTableName) lines.push(`- Selected table name: ${context.selectedTableName}`)

	if (context.selectedTableColumns && context.selectedTableColumns.length > 0) {
		lines.push('- Selected table columns:')
		for (const column of context.selectedTableColumns.slice(0, 40)) {
			const annotations = [
				column.primaryKey ? 'primary key' : '',
				column.nullable === false ? 'not null' : '',
				column.foreignKey ? `fk ${column.foreignKey}` : ''
			].filter(Boolean)
			lines.push(
				`  - ${column.name} ${column.dataType}${annotations.length > 0 ? ` (${annotations.join(', ')})` : ''}`
			)
		}
	}

	if (lines.length === 1) return ''
	return lines.join('\n')
}

/**
 * Pack the conversation history into a single user prompt string so we can
 * reuse the existing `ai_complete_stream` command (which takes a single
 * `prompt`). The Rust chat-mode system prompt is aware of this `USER:` /
 * `ASSISTANT:` shape and will only respond to the trailing user turn.
 */
export function buildChatPrompt(
	messages: ChatMessage[],
	context?: AiAssistantContext
): string {
	const trimmed = messages.filter(function (m) {
		return m.content.trim().length > 0
	})

	if (trimmed.length === 0) return ''
	const contextBlock = buildContextBlock(context)
	if (trimmed.length === 1 && trimmed[0].role === 'user') {
		const userPrompt = trimmed[0].content.trim()
		return contextBlock ? `${contextBlock}\n\nUser request:\n${userPrompt}` : userPrompt
	}

	const parts: string[] = []
	if (contextBlock) {
		parts.push(contextBlock)
	}
	for (const message of trimmed) {
		const tag = message.role === 'user' ? 'USER' : 'ASSISTANT'
		parts.push(`${tag}: ${message.content.trim()}`)
	}
	return parts.join('\n\n')
}
