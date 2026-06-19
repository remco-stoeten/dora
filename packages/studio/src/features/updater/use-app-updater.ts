import { useCallback, useRef, useState } from 'react'

import { isDesktopOnlyError } from '@studio/core/platform'

import {
	checkForUpdate,
	downloadAndInstall,
	restartApp,
	type TAvailableUpdate,
	type TDownloadProgress,
	type TUpdateHandle
} from './updater-api'

export type TUpdaterStatus =
	| 'idle'
	| 'checking'
	| 'up-to-date'
	| 'available'
	| 'downloading'
	| 'installed'
	| 'error'

export type TUseAppUpdater = {
	status: TUpdaterStatus
	available: TAvailableUpdate | null
	progress: TDownloadProgress | null
	error: string | null
	check: () => Promise<void>
	install: () => Promise<void>
}

export function useAppUpdater(): TUseAppUpdater {
	const [status, setStatus] = useState<TUpdaterStatus>('idle')
	const [available, setAvailable] = useState<TAvailableUpdate | null>(null)
	const [progress, setProgress] = useState<TDownloadProgress | null>(null)
	const [error, setError] = useState<string | null>(null)
	const pendingRef = useRef<TUpdateHandle | null>(null)

	const check = useCallback(async function () {
		setStatus('checking')
		setError(null)
		try {
			const update = await checkForUpdate()
			if (!update) {
				pendingRef.current = null
				setAvailable(null)
				setStatus('up-to-date')
				return
			}
			pendingRef.current = update
			setAvailable(update.info)
			setStatus('available')
		} catch (caught) {
			if (isDesktopOnlyError(caught)) {
				setStatus('up-to-date')
				return
			}
			setError(caught instanceof Error ? caught.message : String(caught))
			setStatus('error')
		}
	}, [])

	const install = useCallback(async function () {
		const pending = pendingRef.current
		if (!pending) {
			return
		}
		setStatus('downloading')
		setError(null)
		setProgress({ downloaded: 0 })
		try {
			await downloadAndInstall(pending, function (next) {
				setProgress(next)
			})
			setStatus('installed')
			await restartApp()
		} catch (caught) {
			setError(caught instanceof Error ? caught.message : String(caught))
			setStatus('error')
		}
	}, [])

	return { status, available, progress, error, check, install }
}
