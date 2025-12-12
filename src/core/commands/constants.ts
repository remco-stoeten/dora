export const COMMAND_IDS = {
    // General
    PALETTE_OPEN: 'palette.open',

    // Appearance
    THEME_TOGGLE: 'theme.toggle',

    // Connections
    CONNECTIONS_NEW: 'connections.new',

    // Queries
    QUERIES_RUN: 'queries.run',
    QUERIES_SAVE: 'queries.save',
    SCRIPTS_NEW: 'scripts.new',

    // Editor
    EDITOR_FORMAT: 'editor.format',

    // View
    VIEW_SIDEBAR: 'view.sidebar',
} as const

export type CommandId = typeof COMMAND_IDS[keyof typeof COMMAND_IDS]
