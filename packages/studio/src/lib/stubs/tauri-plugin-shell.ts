import { DesktopOnlyError } from '@studio/core/platform/runtime'

export async function open(_url: string): Promise<void> {
	throw new DesktopOnlyError()
}
