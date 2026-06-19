import { DesktopOnlyError } from '@studio/core/platform/runtime'

export async function readTextFile(_path: string): Promise<string> {
	throw new DesktopOnlyError()
}

export async function writeTextFile(_path: string, _contents: string): Promise<void> {
	throw new DesktopOnlyError()
}

export async function exists(_path: string): Promise<boolean> {
	throw new DesktopOnlyError()
}
