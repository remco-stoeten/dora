import type { QueryResult as AdapterQueryResult } from '@studio/core/data-provider/types'

export type QueryResult = AdapterQueryResult

export type PrismaRunnerProps = {
	connectionId?: string
}

export type TranslationError = {
	error: string
	hint?: string
}
