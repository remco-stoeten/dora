import { DesktopOnlyError } from '@studio/core/platform/runtime'

export class Channel<T> {
	onmessage: ((message: T) => void) | null = null
}

export async function invoke<T>(_cmd: string, _args?: Record<string, unknown>): Promise<T> {
	throw new DesktopOnlyError()
}
