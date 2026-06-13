import type { SourceCaps } from './source-caps'

export type StudioUiAction =
	| 'edit-rows'
	| 'import-csv'
	| 'export-data'
	| 'live-monitor'
	| 'ssh-tunnel'
	| 'local-file'
	| 'remote-url'

const STUDIO_UI_ACTIONS: StudioUiAction[] = [
	'edit-rows',
	'import-csv',
	'export-data',
	'live-monitor',
	'ssh-tunnel',
	'local-file',
	'remote-url',
]

export function isUiActionVisible(action: StudioUiAction, caps: SourceCaps): boolean {
	switch (action) {
		case 'edit-rows':
			return caps.canEditRows
		case 'import-csv':
			return caps.canImportFile
		case 'export-data':
			return caps.canExportFile
		case 'live-monitor':
			return caps.supportsLiveMonitor
		case 'ssh-tunnel':
			return caps.supportsSshTunnel
		case 'local-file':
			return caps.supportsLocalFile
		case 'remote-url':
			return caps.supportsRemoteUrl
	}
}

export function getVisibleUiActions(caps: SourceCaps): StudioUiAction[] {
	return STUDIO_UI_ACTIONS.filter(function (action) {
		return isUiActionVisible(action, caps)
	})
}
