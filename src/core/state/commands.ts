import { create } from 'zustand'
import { CommandDefinition } from '@/types/commands'
import { getAllCommands } from '@/core/tauri/command-api'

interface CommandStore {
    commands: CommandDefinition[]
    isOpen: boolean
    searchQuery: string

    // Actions
    setIsOpen: (isOpen: boolean) => void
    setSearchQuery: (query: string) => void
    loadCommands: () => Promise<void>
    getCommand: (id: string) => CommandDefinition | undefined
}

export const useCommandStore = create<CommandStore>((set, get) => ({
    commands: [],
    isOpen: false,
    searchQuery: '',

    setIsOpen: (isOpen) => set({ isOpen }),
    setSearchQuery: (searchQuery) => set({ searchQuery }),

    loadCommands: async () => {
        try {
            const commands = await getAllCommands()
            console.log('[useCommandStore] Loaded commands:', commands)
            set({ commands })
        } catch (error) {
            console.error('[useCommandStore] Failed to load commands:', error)
        }
    },

    getCommand: (id) => get().commands.find(c => c.id === id),
}))
