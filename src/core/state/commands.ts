

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { CommandDefinition } from '@/types/commands'
import { getAllCommands } from '@/core/tauri/command-api'

interface CommandUsage {
    lastUsed: number
    count: number
}

interface CommandStore {
    commands: CommandDefinition[]
    isOpen: boolean
    searchQuery: string
    usageHistory: Record<string, CommandUsage>

    // Actions
    setIsOpen: (isOpen: boolean) => void
    setSearchQuery: (query: string) => void
    loadCommands: () => Promise<void>
    getCommand: (id: string) => CommandDefinition | undefined
    trackCommandUsage: (id: string) => void
}

export const useCommandStore = create<CommandStore>()(
    persist(
        (set, get) => ({
            commands: [],
            isOpen: false,
            searchQuery: '',
            usageHistory: {},

            setIsOpen: (isOpen) => set({ isOpen }),
            setSearchQuery: (searchQuery) => set({ searchQuery }),

            loadCommands: async () => {
                try {
                    const commands = await getAllCommands()
                    // console.log('[useCommandStore] Loaded commands:', commands)
                    set({ commands })
                } catch (error) {
                    console.error('[useCommandStore] Failed to load commands:', error)
                }
            },

            getCommand: (id) => get().commands.find(c => c.id === id),

            trackCommandUsage: (id) => set((state) => {
                const current = state.usageHistory[id] || { lastUsed: 0, count: 0 }
                return {
                    usageHistory: {
                        ...state.usageHistory,
                        [id]: {
                            lastUsed: Date.now(),
                            count: current.count + 1
                        }
                    }
                }
            }),
        }),
        {
            name: 'command-store',
            partialize: (state) => ({ usageHistory: state.usageHistory }), // Only persist history
        }
    )
)
