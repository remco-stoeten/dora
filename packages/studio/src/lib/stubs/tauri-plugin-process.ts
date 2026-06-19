import { DesktopOnlyError } from '@studio/core/platform/runtime'

// Web stub for @tauri-apps/plugin-process. Relaunching the binary is a
// desktop-only operation.
export async function relaunch(): Promise<void> {
	throw new DesktopOnlyError()
}
