import { DesktopOnlyError } from '@studio/core/platform/runtime'

export async function open(_options?: unknown): Promise<string | string[] | null> {
	throw new DesktopOnlyError()
}

export async function save(_options?: unknown): Promise<string | null> {
	throw new DesktopOnlyError()
}

export async function ask(_message: string, _options?: unknown): Promise<boolean> {
	throw new DesktopOnlyError()
}
