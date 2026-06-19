import { check, type Update } from '@tauri-apps/plugin-updater'
import { relaunch } from '@tauri-apps/plugin-process'

import { assertTauriRuntime, isTauriRuntime } from '@studio/core/platform'

export type TAvailableUpdate = {
	version: string
	currentVersion: string
	notes?: string
	date?: string
}

export type TDownloadProgress = {
	downloaded: number
	contentLength?: number
}

// A pending update kept opaque to callers — the hook holds it so it can drive
// download/install without re-running the network check.
export type TUpdateHandle = {
	info: TAvailableUpdate
	handle: Update
}

function toAvailableUpdate(update: Update): TAvailableUpdate {
	return {
		version: update.version,
		currentVersion: update.currentVersion,
		notes: update.body ?? undefined,
		date: update.date ?? undefined
	}
}

// Returns the pending update, or null when already up to date. Safe to call on
// the web (the stubbed plugin resolves to null).
export async function checkForUpdate(): Promise<TUpdateHandle | null> {
	if (!isTauriRuntime()) {
		return null
	}
	const update = await check()
	if (!update) {
		return null
	}
	return { info: toAvailableUpdate(update), handle: update }
}

export async function downloadAndInstall(
	update: TUpdateHandle,
	onProgress?: (progress: TDownloadProgress) => void
): Promise<void> {
	assertTauriRuntime('Installing updates is only available in the desktop app.')
	let downloaded = 0
	let contentLength: number | undefined
	await update.handle.downloadAndInstall(function (event) {
		switch (event.event) {
			case 'Started':
				contentLength = event.data.contentLength
				onProgress?.({ downloaded: 0, contentLength })
				break
			case 'Progress':
				downloaded += event.data.chunkLength
				onProgress?.({ downloaded, contentLength })
				break
			case 'Finished':
				onProgress?.({ downloaded: contentLength ?? downloaded, contentLength })
				break
		}
	})
}

// Restart the app so the freshly-installed version takes over.
export async function restartApp(): Promise<void> {
	assertTauriRuntime('Restarting is only available in the desktop app.')
	await relaunch()
}
