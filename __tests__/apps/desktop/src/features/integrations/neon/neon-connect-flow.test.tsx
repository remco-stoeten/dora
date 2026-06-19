import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { NeonConnectFlow } from '@studio/features/integrations/neon/neon-connect-flow'
import {
	createNeonConnectionUri,
	isNeonConnected
} from '@studio/features/integrations/neon/neon-api'

vi.mock('@tauri-apps/plugin-shell', () => ({
	open: vi.fn()
}))

vi.mock('@studio/core/data-provider', () => ({
	useIsTauri: () => true
}))

vi.mock('@studio/features/integrations/neon/neon-api', () => ({
	isNeonConnected: vi.fn().mockResolvedValue(false),
	saveNeonToken: vi.fn(),
	createNeonConnectionUri: vi.fn().mockResolvedValue('postgres://neon.example/db'),
	disconnectNeon: vi.fn(),
	getNeonAccount: vi.fn().mockResolvedValue({ email: 'dev@example.com', name: 'Dev' })
}))

vi.mock('@studio/features/integrations/neon/use-neon-databases', () => ({
	useNeonDatabases: () => ({
		databases: [
			{
				projectId: 'superlis',
				projectName: 'superlis',
				branchId: 'main',
				branchName: 'main',
				databaseName: 'neondb',
				roleName: 'owner'
			}
		],
		isLoading: false,
		error: null,
		refresh: vi.fn(),
		reset: vi.fn()
	})
}))

describe('NeonConnectFlow', function () {
	it('copies the Neon API key URL when the external link helper is used', async function () {
		const writeText = vi.fn().mockResolvedValue(undefined)
		Object.defineProperty(navigator, 'clipboard', {
			configurable: true,
			value: { writeText }
		})

		render(<NeonConnectFlow onComplete={vi.fn()} />)

		await userEvent.click(screen.getByRole('button', { name: /copy url here/i }))

		expect(writeText).toHaveBeenCalledWith('https://console.neon.tech/app/settings/api-keys')
		expect(screen.getByText('Copied')).toBeInTheDocument()
	})

	it('keeps the create action in a sticky action bar after a database is selected', async function () {
		vi.mocked(isNeonConnected).mockResolvedValueOnce(true)
		const onComplete = vi.fn()

		render(<NeonConnectFlow onComplete={onComplete} />)

		await userEvent.click(await screen.findByRole('button', { name: /neondb/i }))

		const createButton = screen.getByRole('button', { name: /create neon connection/i })
		expect(createButton.closest('[data-neon-action-bar]')).toHaveClass('sticky')

		await userEvent.click(createButton)
		expect(createNeonConnectionUri).toHaveBeenCalled()
	})
})
