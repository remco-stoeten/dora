import { describe, expect, it } from 'vitest'
import { DEFAULT_SETTINGS, sanitizeSettings } from '@studio/core/settings/settings-store'

describe('sanitizeSettings', () => {
	it('falls back to defaults for invalid persisted values', () => {
		const settings = sanitizeSettings({
			confirmBeforeDelete: 'yes',
			editorFontSize: 999,
			editorTheme: 'unknown-theme',
			enableVimMode: 'true',
			restoreLastConnection: false,
			startupConnectionMode: 'sideways',
			lastConnectionId: 123,
			lastTableId: '',
			lastRowPK: { bad: true },
			selectionBarStyle: 'popup',
			showToasts: 'no'
		})

		expect(settings).toEqual({
			...DEFAULT_SETTINGS,
			editorFontSize: 24,
			restoreLastConnection: false,
			startupConnectionMode: 'empty'
		})
	})

	it('keeps valid persisted values', () => {
		const settings = sanitizeSettings({
			confirmBeforeDelete: false,
			editorFontSize: 15.6,
			editorTheme: 'github-dark',
			enableVimMode: true,
			startupConnectionMode: 'auto',
			lastConnectionId: 'conn-1',
			lastTableId: 'public.users',
			lastRowPK: 42,
			selectionBarStyle: 'static',
			showToasts: false
		})

		expect(settings.confirmBeforeDelete).toBe(false)
		expect(settings.editorFontSize).toBe(16)
		expect(settings.editorTheme).toBe('github-dark')
		expect(settings.enableVimMode).toBe(true)
		expect(settings.restoreLastConnection).toBe(true)
		expect(settings.lastConnectionId).toBe('conn-1')
		expect(settings.lastTableId).toBe('public.users')
		expect(settings.lastRowPK).toBe(42)
		expect(settings.selectionBarStyle).toBe('static')
		expect(settings.showToasts).toBe(false)
	})
})
