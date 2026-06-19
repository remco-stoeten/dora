// Web stub for @tauri-apps/plugin-updater. The updater only exists in the
// desktop app, so on the web `check()` resolves to "no update available".
export async function check(): Promise<null> {
	return null
}
