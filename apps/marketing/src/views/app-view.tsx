'use client'

import {
    ArrowRight,
    Bot,
    Boxes,
    Check,
    ChevronRight,
    Circle,
    Clock3,
    Command,
    Copy,
    Database,
    GitBranch,
    History,
    Loader2,
    PanelLeft,
    Play,
    Plus,
    RotateCcw,
    Save,
    Search,
    Settings,
    Sparkles,
    SquareTerminal,
    Table2,
    Terminal,
    Trash2,
    X,
    Wand2
} from 'lucide-react'
import type { ComponentType, ReactNode } from 'react'
import { useEffect, useMemo, useState } from 'react'

type TViewId = 'database-studio' | 'sql-console' | 'schema-visualizer' | 'docker' | 'settings'
type TColumn = { name: string; type: string; primary?: boolean; nullable?: boolean }
type TRow = Record<string, string | number | boolean>
type TTable = { id: string; name: string; schema: string; columns: TColumn[]; rows: TRow[] }
type TConnection = {
    id: string
    name: string
    type: 'PostgreSQL' | 'SQLite' | 'libSQL' | 'MySQL'
    status: 'connected' | 'disconnected'
    color: string
    tables: TTable[]
}
type TTab = { id: string; connectionId: string; tableId: string; label: string }
type TContainer = {
    id: string
    name: string
    image: string
    port: string
    status: 'running' | 'stopped' | 'restarting'
    health: 'healthy' | 'starting' | 'none'
}
type TMessage = { role: 'user' | 'assistant'; content: string }

const NAV_ITEMS: { id: TViewId; label: string; icon: ComponentType<{ className?: string }> }[] = [
    { id: 'sql-console', label: 'SQL Console', icon: SquareTerminal },
    { id: 'database-studio', label: 'Data Viewer', icon: Table2 },
    { id: 'schema-visualizer', label: 'Schema', icon: GitBranch },
    { id: 'docker', label: 'Docker Manager', icon: Boxes },
    { id: 'settings', label: 'Settings', icon: Settings }
]

const INITIAL_CONNECTIONS: TConnection[] = [
    {
        id: 'demo-ecommerce-001',
        name: 'Production Store',
        type: 'PostgreSQL',
        status: 'connected',
        color: '#f5c0c0',
        tables: [
            {
                id: 'public.customers',
                name: 'customers',
                schema: 'public',
                columns: [
                    { name: 'id', type: 'uuid', primary: true },
                    { name: 'email', type: 'text' },
                    { name: 'plan', type: 'text' },
                    { name: 'orders', type: 'int' },
                    { name: 'lifetime_value', type: 'numeric' }
                ],
                rows: [
                    { id: 'cus_001', email: 'ada@dora.local', plan: 'pro', orders: 18, lifetime_value: 4280 },
                    { id: 'cus_002', email: 'linus@dora.local', plan: 'team', orders: 7, lifetime_value: 1884 },
                    { id: 'cus_003', email: 'grace@dora.local', plan: 'free', orders: 2, lifetime_value: 96 },
                    { id: 'cus_004', email: 'margaret@dora.local', plan: 'pro', orders: 11, lifetime_value: 2650 }
                ]
            },
            {
                id: 'public.orders',
                name: 'orders',
                schema: 'public',
                columns: [
                    { name: 'id', type: 'uuid', primary: true },
                    { name: 'customer_id', type: 'uuid' },
                    { name: 'status', type: 'text' },
                    { name: 'total', type: 'numeric' },
                    { name: 'created_at', type: 'timestamp' }
                ],
                rows: [
                    { id: 'ord_101', customer_id: 'cus_001', status: 'paid', total: 240, created_at: '2026-05-30' },
                    { id: 'ord_102', customer_id: 'cus_002', status: 'pending', total: 88, created_at: '2026-05-31' },
                    { id: 'ord_103', customer_id: 'cus_001', status: 'refunded', total: 120, created_at: '2026-06-01' }
                ]
            },
            {
                id: 'analytics.events',
                name: 'events',
                schema: 'analytics',
                columns: [
                    { name: 'id', type: 'bigint', primary: true },
                    { name: 'name', type: 'text' },
                    { name: 'source', type: 'text' },
                    { name: 'count', type: 'int' }
                ],
                rows: [
                    { id: 1, name: 'page_view', source: 'web', count: 9342 },
                    { id: 2, name: 'checkout_started', source: 'web', count: 421 },
                    { id: 3, name: 'query_run', source: 'desktop', count: 1288 }
                ]
            }
        ]
    },
    {
        id: 'demo-blog-002',
        name: 'Content Blog',
        type: 'SQLite',
        status: 'connected',
        color: '#ad8eb6',
        tables: [
            {
                id: 'main.posts',
                name: 'posts',
                schema: 'main',
                columns: [
                    { name: 'id', type: 'integer', primary: true },
                    { name: 'title', type: 'text' },
                    { name: 'slug', type: 'text' },
                    { name: 'published', type: 'boolean' }
                ],
                rows: [
                    { id: 1, title: 'Release notes', slug: 'release-notes', published: true },
                    { id: 2, title: 'Design system', slug: 'design-system', published: true }
                ]
            },
            {
                id: 'main.comments',
                name: 'comments',
                schema: 'main',
                columns: [
                    { name: 'id', type: 'integer', primary: true },
                    { name: 'post_id', type: 'integer' },
                    { name: 'author', type: 'text' },
                    { name: 'body', type: 'text' }
                ],
                rows: [
                    { id: 1, post_id: 1, author: 'Quinten', body: 'Looks good' },
                    { id: 2, post_id: 1, author: 'Marie', body: 'Ship it' }
                ]
            }
        ]
    },
    {
        id: 'demo-analytics-003',
        name: 'Analytics',
        type: 'libSQL',
        status: 'disconnected',
        color: '#9bc8ff',
        tables: [
            {
                id: 'stats.page_views',
                name: 'page_views',
                schema: 'stats',
                columns: [
                    { name: 'id', type: 'integer', primary: true },
                    { name: 'path', type: 'text' },
                    { name: 'count', type: 'integer' }
                ],
                rows: [
                    { id: 1, path: '/', count: 12042 },
                    { id: 2, path: '/docs', count: 2311 },
                    { id: 3, path: '/downloads', count: 1044 }
                ]
            }
        ]
    }
]

const INITIAL_CONTAINERS: TContainer[] = [
    { id: 'a1b2c3', name: 'dora-postgres', image: 'postgres:16', port: '5433', status: 'running', health: 'healthy' },
    { id: 'b2c3d4', name: 'dora-devdb', image: 'postgres:17', port: '5434', status: 'running', health: 'healthy' },
    { id: 'c3d4e5', name: 'dora-scratch', image: 'postgres:16', port: '5435', status: 'stopped', health: 'none' },
    { id: 'd4e5f6', name: 'redis-cache', image: 'redis:7-alpine', port: '6379', status: 'running', health: 'healthy' }
]

const INITIAL_HISTORY = [
    { id: 1, sql: 'select * from customers limit 50;', status: 'ok' as const, rows: 4, duration: 18 },
    { id: 2, sql: 'select status, count(*) from orders group by status;', status: 'ok' as const, rows: 3, duration: 11 },
    { id: 3, sql: 'update customers set plan = \'team\' where id = \'cus_003\';', status: 'ok' as const, rows: 1, duration: 22 }
]

function cn(...parts: Array<string | false | null | undefined>) {
    return parts.filter(Boolean).join(' ')
}

function formatType(type: TConnection['type']) {
    return type
}

function makeTabId(connectionId: string, tableId: string) {
    return `${connectionId}:${tableId}`
}

function queryResultFor(connection: TConnection, sql: string) {
    const normalized = sql.toLowerCase()
    const table =
        connection.tables.find((item) => normalized.includes(item.name.toLowerCase())) ??
        connection.tables[0]

    if (normalized.includes('count(') || normalized.includes('group by')) {
        return {
            columns: ['status', 'count'],
            rows: [
                { status: 'paid', count: 1 },
                { status: 'pending', count: 1 },
                { status: 'refunded', count: 1 }
            ]
        }
    }

    return {
        columns: table.columns.map((column) => column.name),
        rows: table.rows
    }
}

function AppButton({
    children,
    icon: Icon,
    onClick,
    tone = 'default',
    className
}: {
    children: ReactNode
    icon?: ComponentType<{ className?: string }>
    onClick?: () => void
    tone?: 'default' | 'accent' | 'danger'
    className?: string
}) {
    return (
        <button
            className={cn(
                'inline-flex h-8 items-center gap-2 border px-3 text-xs font-medium transition-colors',
                tone === 'default' && 'border-border bg-background text-foreground hover:bg-sidebar-accent/40',
                tone === 'accent' && 'border-primary/30 bg-primary/10 text-foreground hover:bg-primary/15',
                tone === 'danger' && 'border-destructive/30 bg-destructive/10 text-destructive hover:bg-destructive/15',
                className
            )}
            onClick={onClick}
            type="button"
        >
            {Icon ? <Icon className="h-3.5 w-3.5" /> : null}
            {children}
        </button>
    )
}

function TabBar({
    tabs,
    activeTabId,
    onTabClick,
    onTabClose,
    rightSlot
}: {
    tabs: TTab[]
    activeTabId: string | null
    onTabClick: (tabId: string) => void
    onTabClose: (tabId: string) => void
    rightSlot?: ReactNode
}) {
    return (
        <div className="flex h-9 items-center border-b border-border bg-sidebar select-none" data-tauri-drag-region="true">
            <div className="flex min-w-0 flex-1 items-center overflow-x-auto">
                {tabs.map((tab) => (
                    <div
                        key={tab.id}
                        className={cn(
                            'flex h-full shrink-0 items-center border-r border-border transition-colors',
                            tab.id === activeTabId
                                ? 'bg-background text-foreground'
                                : 'text-muted-foreground hover:bg-sidebar-accent/50 hover:text-foreground'
                        )}
                        data-tauri-drag-region="false"
                    >
                        <button
                            className="flex h-full items-center gap-1.5 px-2 pl-3 text-xs font-medium"
                            data-tauri-drag-region="false"
                            onClick={() => onTabClick(tab.id)}
                            type="button"
                        >
                            <span className="max-w-[120px] truncate">{tab.label}</span>
                        </button>
                        <button
                            aria-label={`Close ${tab.label}`}
                            className="h-full px-1 pr-2 text-muted-foreground hover:bg-sidebar-accent hover:text-foreground"
                            data-tauri-drag-region="false"
                            onClick={(event) => {
                                event.stopPropagation()
                                onTabClose(tab.id)
                            }}
                            type="button"
                        >
                            <X className="h-3 w-3" />
                        </button>
                    </div>
                ))}
            </div>
            {rightSlot ? (
                <div className="flex h-full shrink-0 items-center border-l border-border px-1" data-tauri-drag-region="false">
                    {rightSlot}
                </div>
            ) : null}
        </div>
    )
}

function NavigationSidebar({
    activeNavId,
    onNavSelect
}: {
    activeNavId: TViewId
    onNavSelect: (id: TViewId) => void
}) {
    return (
        <aside className="flex h-full w-16 flex-col border-r border-sidebar-border bg-sidebar">
            <div className="flex flex-col items-center gap-4 pt-2">
                <button
                    aria-label="Go to home"
                    className="rounded-md transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring focus-visible:ring-offset-2 focus-visible:ring-offset-sidebar"
                    onClick={() => onNavSelect('database-studio')}
                    title="Dora AI Home"
                    type="button"
                >
                    <div className="flex h-7 w-7 items-center justify-center border border-sidebar-border text-xs font-semibold text-primary">
                        D
                    </div>
                </button>
                <div className="h-px w-8 bg-sidebar-border" />
            </div>
            <nav className="flex flex-1 flex-col gap-1 p-2" aria-label="Main navigation" role="menubar">
                <div className="mx-auto flex flex-col gap-1">
                    {NAV_ITEMS.map((item) => {
                        const Icon = item.icon
                        const active = item.id === activeNavId
                        return (
                            <button
                                key={item.id}
                                aria-label={item.label}
                                className={cn(
                                    'flex h-10 w-10 items-center justify-center border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring',
                                    active
                                        ? 'border-sidebar-primary/40 bg-sidebar-primary/10 text-sidebar-foreground'
                                        : 'border-transparent text-muted-foreground hover:border-sidebar-border hover:bg-sidebar-accent/40 hover:text-sidebar-foreground'
                                )}
                                onClick={() => onNavSelect(item.id)}
                                title={item.label}
                                type="button"
                            >
                                <Icon className="h-4 w-4" />
                            </button>
                        )
                    })}
                </div>
                <div className="mt-auto flex flex-col gap-1 pb-2">
                    <button
                        aria-label="Settings"
                        className={cn(
                            'flex h-10 w-10 items-center justify-center border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring',
                            activeNavId === 'settings'
                                ? 'border-sidebar-primary/40 bg-sidebar-primary/10 text-sidebar-foreground'
                                : 'border-transparent text-muted-foreground hover:border-sidebar-border hover:bg-sidebar-accent/40 hover:text-sidebar-foreground'
                        )}
                        onClick={() => onNavSelect('settings')}
                        title="Settings"
                        type="button"
                    >
                        <Settings className="h-4 w-4" />
                    </button>
                </div>
            </nav>
        </aside>
    )
}

function ConnectionSidebar({
    connections,
    activeConnectionId,
    onConnectionSelect,
    onTableSelect,
    selectedTableId
}: {
    connections: TConnection[]
    activeConnectionId: string
    onConnectionSelect: (id: string) => void
    onTableSelect: (tableId: string, tableName: string) => void
    selectedTableId: string | null
}) {
    const activeConnection = connections.find((connection) => connection.id === activeConnectionId) ?? connections[0]

    return (
        <aside className="hidden w-[280px] shrink-0 border-r border-sidebar-border bg-sidebar lg:block">
            <div className="border-b border-sidebar-border p-3">
                <div className="mb-2 flex items-center gap-2 text-xs uppercase tracking-[0.16em] text-muted-foreground">
                    <Database className="h-3.5 w-3.5" />
                    Connections
                </div>
                <div className="space-y-1">
                    {connections.map((connection) => (
                        <button
                            key={connection.id}
                            className={cn(
                                'flex w-full items-center gap-2 border px-2 py-2 text-left text-xs transition-colors',
                                connection.id === activeConnectionId
                                    ? 'border-sidebar-primary/40 bg-sidebar-primary/10 text-sidebar-foreground'
                                    : 'border-transparent text-muted-foreground hover:border-sidebar-border hover:bg-sidebar-accent/40 hover:text-sidebar-foreground'
                            )}
                            onClick={() => onConnectionSelect(connection.id)}
                            type="button"
                        >
                            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: connection.color }} />
                            <span className="min-w-0 flex-1 truncate">{connection.name}</span>
                            <span className="text-[10px] text-muted-foreground">{connection.status}</span>
                        </button>
                    ))}
                </div>
            </div>
            <div className="p-3">
                <div className="mb-2 flex items-center gap-2 text-xs uppercase tracking-[0.16em] text-muted-foreground">
                    <Table2 className="h-3.5 w-3.5" />
                    Tables
                </div>
                <div className="space-y-1">
                    {activeConnection.tables.map((table) => (
                        <button
                            key={table.id}
                            className={cn(
                                'flex w-full items-center gap-2 px-2 py-1.5 text-left text-xs transition-colors',
                                selectedTableId === table.id
                                    ? 'bg-sidebar-primary/10 text-sidebar-foreground'
                                    : 'text-muted-foreground hover:bg-sidebar-accent/40 hover:text-sidebar-foreground'
                            )}
                            onClick={() => onTableSelect(table.id, table.name)}
                            type="button"
                        >
                            <ChevronRight className="h-3 w-3 text-muted-foreground" />
                            <span className="min-w-0 flex-1 truncate">
                                {table.schema}.{table.name}
                            </span>
                            <span className="text-[10px] text-muted-foreground">{table.rows.length}</span>
                        </button>
                    ))}
                </div>
            </div>
        </aside>
    )
}

function ValueCell({ value }: { value: string | number | boolean }) {
    if (typeof value === 'boolean') return <>{value ? 'true' : 'false'}</>
    return <>{String(value)}</>
}

function DatabaseStudioView({
    table,
    search,
    setSearch,
    selectedRows,
    setSelectedRows,
    onInsertRow,
    onDuplicateRows,
    onDeleteRows
}: {
    table: TTable
    search: string
    setSearch: (value: string) => void
    selectedRows: Set<number>
    setSelectedRows: (rows: Set<number>) => void
    onInsertRow: () => void
    onDuplicateRows: () => void
    onDeleteRows: () => void
}) {
    const filteredRows = table.rows.filter((row) =>
        Object.values(row).join(' ').toLowerCase().includes(search.toLowerCase())
    )

    function toggleRow(index: number) {
        const next = new Set(selectedRows)
        if (next.has(index)) next.delete(index)
        else next.add(index)
        setSelectedRows(next)
    }

    return (
        <div className="flex h-full flex-col bg-background">
            <div className="flex h-10 items-center justify-between border-b border-border bg-sidebar px-2">
                <div className="flex items-center gap-2">
                    <button
                        className="flex h-7 w-7 items-center justify-center text-muted-foreground hover:text-foreground"
                        title="Toggle sidebar"
                        type="button"
                    >
                        <PanelLeft className="h-4 w-4" />
                    </button>
                    <span className="px-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Database Studio
                    </span>
                </div>
                <div className="flex items-center gap-1">
                    <AppButton icon={Plus} onClick={onInsertRow}>
                        Add Row
                    </AppButton>
                    <AppButton icon={Copy} onClick={onDuplicateRows}>
                        Duplicate
                    </AppButton>
                    <AppButton icon={Trash2} onClick={onDeleteRows} tone="danger">
                        Delete
                    </AppButton>
                </div>
            </div>
            <div className="flex-1 overflow-auto p-4">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <h1 className="text-lg font-medium text-foreground">{table.name}</h1>
                        <p className="text-xs text-muted-foreground">
                            {table.rows.length} rows / {table.columns.length} columns
                        </p>
                    </div>
                    <label className="flex h-9 items-center gap-2 border border-border bg-background px-3 text-xs text-muted-foreground">
                        <Search className="h-3.5 w-3.5" />
                        <input
                            className="w-44 bg-transparent text-sm text-foreground outline-none"
                            onChange={(event) => setSearch(event.target.value)}
                            placeholder="Filter rows"
                            value={search}
                        />
                    </label>
                </div>
                <div className="overflow-hidden border border-border bg-background">
                    <table className="w-full min-w-[760px] border-separate border-spacing-0 text-sm">
                        <thead className="sticky top-0 z-10 bg-sidebar">
                            <tr>
                                <th className="w-10 border-b border-border px-3 py-2" />
                                {table.columns.map((column) => (
                                    <th
                                        key={column.name}
                                        className="border-b border-border px-3 py-2 text-left text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground"
                                    >
                                        <span className="flex items-center gap-2">
                                            {column.name}
                                            {column.primary ? <span className="text-primary">pk</span> : null}
                                        </span>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {filteredRows.map((row) => {
                                const rowIndex = table.rows.indexOf(row)
                                return (
                                    <tr key={`${table.id}-${rowIndex}`} className="hover:bg-sidebar-accent/30">
                                        <td className="border-b border-border px-3 py-2">
                                            <input
                                                checked={selectedRows.has(rowIndex)}
                                                onChange={() => toggleRow(rowIndex)}
                                                type="checkbox"
                                            />
                                        </td>
                                        {table.columns.map((column) => (
                                            <td key={column.name} className="border-b border-border px-3 py-2 text-foreground">
                                                <input
                                                    className="w-full min-w-[100px] bg-transparent outline-none focus:text-primary"
                                                    defaultValue={String(row[column.name] ?? '')}
                                                    onBlur={(event) => {
                                                        const next = event.target.value
                                                        if (next !== String(row[column.name] ?? '')) {
                                                            row[column.name] = next
                                                        }
                                                    }}
                                                />
                                            </td>
                                        ))}
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
            <div className="flex h-10 items-center justify-between border-t border-border bg-sidebar px-3 text-xs text-muted-foreground">
                <div className="flex items-center gap-4">
                    <span>{filteredRows.length} visible</span>
                    <span>{selectedRows.size} selected</span>
                </div>
                <div className="flex items-center gap-2">
                    <Clock3 className="h-3.5 w-3.5" />
                    Mock updates only
                </div>
            </div>
        </div>
    )
}

function SqlConsoleView({
    connection,
    sql,
    setSql,
    result,
    onRun,
    snippets,
    onUseSnippet,
    onSave,
    history,
    onRerun
}: {
    connection: TConnection
    sql: string
    setSql: (value: string) => void
    result: { columns: string[]; rows: TRow[] } | null
    onRun: () => void
    snippets: string[]
    onUseSnippet: (snippet: string) => void
    onSave: () => void
    history: typeof INITIAL_HISTORY
    onRerun: (sqlText: string) => void
}) {
    return (
        <div className="flex h-full flex-col">
            <div className="flex h-10 items-center justify-between border-b border-border bg-sidebar px-2">
                <div className="flex items-center gap-2">
                    <button className="flex h-7 w-7 items-center justify-center text-muted-foreground hover:text-foreground" type="button">
                        <PanelLeft className="h-4 w-4" />
                    </button>
                    <span className="px-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        SQL Console
                    </span>
                </div>
                <div className="flex items-center gap-1">
                    <AppButton icon={Save} onClick={onSave}>
                        Save
                    </AppButton>
                    <AppButton icon={Play} onClick={onRun} tone="accent">
                        Run
                    </AppButton>
                </div>
            </div>
            <div className="grid min-h-0 flex-1 grid-cols-[minmax(0,1fr)_280px]">
                <div className="min-h-0 border-r border-border">
                    <div className="h-full grid grid-rows-[minmax(220px,40%)_minmax(0,1fr)]">
                        <div className="border-b border-border p-3">
                            <div className="mb-2 flex items-center justify-between">
                                <div className="flex items-center gap-2 text-xs uppercase tracking-[0.16em] text-muted-foreground">
                                    <Terminal className="h-3.5 w-3.5" />
                                    Query editor
                                </div>
                                <div className="text-xs text-muted-foreground">{connection.name}</div>
                            </div>
                            <textarea
                                className="h-[calc(100%-36px)] w-full resize-none border border-border bg-background p-3 font-mono text-sm leading-relaxed text-foreground outline-none focus:border-primary/35"
                                onChange={(event) => setSql(event.target.value)}
                                spellCheck={false}
                                value={sql}
                            />
                        </div>
                        <div className="min-h-0 overflow-auto p-3">
                            {result ? (
                                <table className="w-full min-w-[520px] border-separate border-spacing-0 text-sm">
                                    <thead>
                                        <tr>
                                            {result.columns.map((column) => (
                                                <th
                                                    key={column}
                                                    className="border-b border-border px-3 py-2 text-left text-xs uppercase tracking-[0.14em] text-muted-foreground"
                                                >
                                                    {column}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {result.rows.map((row, index) => (
                                            <tr key={index}>
                                                {result.columns.map((column) => (
                                                    <td key={column} className="border-b border-border px-3 py-2 text-foreground">
                                                        <ValueCell value={(row[column] ?? '') as string} />
                                                    </td>
                                                ))}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            ) : (
                                <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                                    Run a query to inspect mocked results.
                                </div>
                            )}
                        </div>
                    </div>
                </div>
                <aside className="min-h-0 overflow-auto bg-sidebar/40 p-3">
                    <div className="mb-2 text-xs uppercase tracking-[0.16em] text-muted-foreground">
                        Snippets
                    </div>
                    <div className="space-y-2">
                        {snippets.map((snippet) => (
                            <button
                                key={snippet}
                                className="block w-full border border-border bg-background p-2 text-left font-mono text-xs text-foreground hover:border-primary/35"
                                onClick={() => onUseSnippet(snippet)}
                                type="button"
                            >
                                {snippet}
                            </button>
                        ))}
                    </div>
                    <div className="my-4 border-t border-border" />
                    <div className="mb-2 text-xs uppercase tracking-[0.16em] text-muted-foreground">
                        History
                    </div>
                    <div className="space-y-2">
                        {history.map((entry) => (
                            <button
                                key={entry.id}
                                className="flex w-full items-center gap-2 border border-border bg-background px-2 py-2 text-left text-xs text-muted-foreground hover:border-primary/35 hover:text-foreground"
                                onClick={() => onRerun(entry.sql)}
                                type="button"
                            >
                                <History className="h-3.5 w-3.5" />
                                <span className="min-w-0 flex-1 truncate font-mono">{entry.sql}</span>
                            </button>
                        ))}
                    </div>
                </aside>
            </div>
        </div>
    )
}

function SchemaVisualizerView({ connection }: { connection: TConnection }) {
    return (
        <div className="grid h-full min-h-0 grid-cols-[minmax(0,1fr)_280px]">
            <div className="min-h-0 overflow-auto p-4">
                <div className="mb-4 flex items-center gap-2 text-xs uppercase tracking-[0.16em] text-muted-foreground">
                    <GitBranch className="h-3.5 w-3.5" />
                    Schema map
                </div>
                <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                    {connection.tables.map((table) => (
                        <div key={table.id} className="border border-border bg-background">
                            <div className="border-b border-border px-3 py-2">
                                <div className="text-sm font-medium text-foreground">{table.name}</div>
                                <div className="text-xs text-muted-foreground">{table.schema}</div>
                            </div>
                            <div className="divide-y divide-border">
                                {table.columns.map((column) => (
                                    <div key={column.name} className="flex items-center justify-between px-3 py-2 text-xs">
                                        <span className="text-foreground">{column.name}</span>
                                        <span className="text-muted-foreground">
                                            {column.type}
                                            {column.primary ? ' / pk' : ''}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
            <aside className="border-l border-border bg-sidebar/40 p-4">
                <div className="mb-4 text-xs uppercase tracking-[0.16em] text-muted-foreground">
                    Overview
                </div>
                <div className="space-y-3 text-sm">
                    <div className="border border-border bg-background p-3">
                        <div className="text-primary">Tables</div>
                        <div className="text-xs text-muted-foreground">{connection.tables.length} visible in this connection</div>
                    </div>
                    <div className="border border-border bg-background p-3">
                        <div className="text-primary">Relationships</div>
                        <div className="text-xs text-muted-foreground">Mocked graph connections from the desktop app</div>
                    </div>
                    <div className="border border-border bg-background p-3">
                        <div className="text-primary">Legend</div>
                        <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                                <Database className="h-3.5 w-3.5" />
                                Table
                            </span>
                            <span className="flex items-center gap-1">
                                <GitBranch className="h-3.5 w-3.5" />
                                Relation
                            </span>
                        </div>
                    </div>
                </div>
            </aside>
        </div>
    )
}

function DockerView({
    containers,
    onStart,
    onStop,
    onRestart,
    onDelete,
    onCreate
}: {
    containers: TContainer[]
    onStart: (id: string) => void
    onStop: (id: string) => void
    onRestart: (id: string) => void
    onDelete: (id: string) => void
    onCreate: () => void
}) {
    return (
        <div className="flex h-full flex-col">
            <div className="flex h-10 items-center justify-between border-b border-border bg-sidebar px-2">
                <div className="flex items-center gap-2">
                    <button className="flex h-7 w-7 items-center justify-center text-muted-foreground hover:text-foreground" type="button">
                        <PanelLeft className="h-4 w-4" />
                    </button>
                    <span className="px-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Docker Manager
                    </span>
                </div>
                <AppButton icon={Plus} onClick={onCreate} tone="accent">
                    New Container
                </AppButton>
            </div>
            <div className="grid min-h-0 flex-1 grid-cols-[minmax(0,1fr)_320px]">
                <div className="min-h-0 overflow-auto p-4">
                    <div className="grid gap-3">
                        {containers.map((container) => (
                            <div key={container.id} className="border border-border bg-background p-3">
                                <div className="mb-3 flex items-start justify-between gap-3">
                                    <div>
                                        <div className="text-sm font-medium text-foreground">{container.name}</div>
                                        <div className="text-xs text-muted-foreground">
                                            {container.image} / :{container.port}
                                        </div>
                                    </div>
                                    <span
                                        className={cn(
                                            'inline-flex items-center gap-1 border px-2 py-0.5 text-[10px] uppercase tracking-[0.14em]',
                                            container.status === 'running'
                                                ? 'border-emerald-500/25 bg-emerald-500/10 text-emerald-300'
                                                : container.status === 'restarting'
                                                    ? 'border-amber-500/25 bg-amber-500/10 text-amber-300'
                                                    : 'border-muted-foreground/20 bg-muted/10 text-muted-foreground'
                                        )}
                                    >
                                        {container.status}
                                    </span>
                                </div>
                                <div className="mb-3 border border-border bg-sidebar/30 p-3 font-mono text-xs text-muted-foreground">
                                    health={container.health} / logs available / demo state
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    <AppButton icon={Play} onClick={() => onStart(container.id)}>
                                        Start
                                    </AppButton>
                                    <AppButton icon={RotateCcw} onClick={() => onRestart(container.id)}>
                                        Restart
                                    </AppButton>
                                    <AppButton icon={X} onClick={() => onStop(container.id)}>
                                        Stop
                                    </AppButton>
                                    <AppButton icon={Trash2} onClick={() => onDelete(container.id)} tone="danger">
                                        Delete
                                    </AppButton>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
                <aside className="border-l border-border bg-sidebar/40 p-4">
                    <div className="mb-2 text-xs uppercase tracking-[0.16em] text-muted-foreground">
                        Details
                    </div>
                    <div className="space-y-3">
                        <div className="border border-border bg-background p-3">
                            <div className="text-sm text-foreground">Selected container</div>
                            <div className="text-xs text-muted-foreground">Click a container to inspect its logs and status in the real desktop app.</div>
                        </div>
                        <div className="border border-border bg-background p-3">
                            <div className="text-sm text-foreground">Port mapping</div>
                            <div className="mt-2 font-mono text-xs text-muted-foreground">5432 -&gt; host ports, managed locally</div>
                        </div>
                    </div>
                </aside>
            </div>
        </div>
    )
}

function SettingsView() {
    const sections = [
        { id: 'editor', title: 'Editor', description: 'Font size, syntax theme, and Vim mode' },
        { id: 'shortcuts', title: 'Shortcuts', description: 'Keyboard bindings and overrides' },
        { id: 'ai-keys', title: 'AI Keys', description: 'Mock key storage and health checks' },
        { id: 'storage', title: 'Storage', description: 'Database locations and switching' },
        { id: 'safety', title: 'Safety', description: 'Destructive action confirmations' },
        { id: 'startup', title: 'Startup', description: 'Default connection behavior' },
        { id: 'interface', title: 'Interface', description: 'Selection bar and toast behavior' }
    ]

    return (
        <div className="flex h-full min-h-0 overflow-hidden bg-background">
            <aside className="flex w-[244px] shrink-0 flex-col border-r border-border bg-sidebar">
                <div className="flex h-16 flex-col justify-center border-b border-border px-3">
                    <div className="text-sm font-semibold text-foreground">Settings</div>
                    <div className="mt-0.5 text-xs text-muted-foreground">{sections.length} sections</div>
                </div>
                <div className="min-h-0 flex-1 overflow-y-auto py-2">
                    {sections.map((section) => (
                        <div
                            key={section.id}
                            className="border-l-2 border-transparent px-3 py-2 text-left transition-colors hover:border-border hover:bg-sidebar-accent/35"
                        >
                            <div className="text-sm font-medium text-foreground">{section.title}</div>
                            <div className="text-[11px] leading-tight text-muted-foreground">{section.description}</div>
                        </div>
                    ))}
                </div>
            </aside>
            <main className="min-w-0 flex-1 overflow-auto">
                <div className="flex h-16 items-center justify-between gap-4 border-b border-border bg-sidebar/20 px-5">
                    <div className="min-w-0">
                        <h1 className="text-base font-semibold text-foreground">Application settings</h1>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                            Editor behavior, shortcuts, AI keys, storage, and interface preferences
                        </p>
                    </div>
                </div>
                <div className="p-5">
                    <div className="grid gap-4">
                        <div className="border border-border bg-background p-4">
                            <div className="mb-2 text-sm font-medium text-foreground">Editor</div>
                            <div className="text-xs text-muted-foreground">Mock controls mirror the desktop settings panel.</div>
                        </div>
                        <div className="border border-border bg-background p-4">
                            <div className="mb-2 text-sm font-medium text-foreground">Shortcuts</div>
                            <div className="text-xs text-muted-foreground">Command palette, navigation shortcuts, and the app chrome all behave locally.</div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    )
}

function CommandPalette({
    open,
    onOpenChange,
    query,
    setQuery,
    actions,
    onAction
}: {
    open: boolean
    onOpenChange: (open: boolean) => void
    query: string
    setQuery: (value: string) => void
    actions: { id: string; label: string; description: string; icon: ComponentType<{ className?: string }>; onSelect: () => void }[]
    onAction: (id: string) => void
}) {
    if (!open) return null

    const matches = actions.filter((action) =>
        `${action.label} ${action.description}`.toLowerCase().includes(query.toLowerCase())
    )

    return (
        <div className="fixed inset-0 z-50 bg-black/60 p-4" onClick={() => onOpenChange(false)}>
            <div
                className="mx-auto mt-[12vh] max-w-xl border border-border bg-background shadow-2xl"
                onClick={(event) => event.stopPropagation()}
            >
                <div className="flex items-center gap-2 border-b border-border px-3 py-2">
                    <Command className="h-4 w-4 text-primary" />
                    <input
                        autoFocus
                        className="h-9 flex-1 bg-transparent text-sm outline-none"
                        onChange={(event) => setQuery(event.target.value)}
                        placeholder="Jump to..."
                        value={query}
                    />
                </div>
                <div className="max-h-80 overflow-auto p-2">
                    {matches.map((action) => {
                        const Icon = action.icon
                        return (
                            <button
                                key={action.id}
                                className="flex w-full items-center gap-3 px-3 py-2 text-left text-sm hover:bg-sidebar-accent/40"
                                onClick={() => {
                                    onAction(action.id)
                                    action.onSelect()
                                    onOpenChange(false)
                                }}
                                type="button"
                            >
                                <Icon className="h-4 w-4 text-muted-foreground" />
                                <span className="flex-1">
                                    <span className="block text-foreground">{action.label}</span>
                                    <span className="block text-xs text-muted-foreground">{action.description}</span>
                                </span>
                            </button>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}

function ConnectionDialog({
    open,
    onOpenChange,
    initialValues,
    onSave
}: {
    open: boolean
    onOpenChange: (open: boolean) => void
    initialValues?: Partial<TConnection>
    onSave: (connection: Omit<TConnection, 'id' | 'status' | 'tables' | 'color'> & { type: TConnection['type'] }) => void
}) {
    const [name, setName] = useState(initialValues?.name ?? '')
    const [type, setType] = useState<TConnection['type']>(initialValues?.type ?? 'PostgreSQL')

    useEffect(
        function syncInitialValues() {
            if (!open) return
            setName(initialValues?.name ?? '')
            setType(initialValues?.type ?? 'PostgreSQL')
        },
        [initialValues, open]
    )

    if (!open) return null

    return (
        <div className="fixed inset-0 z-50 bg-black/60 p-4" onClick={() => onOpenChange(false)}>
            <div className="mx-auto mt-[12vh] max-w-2xl border border-border bg-background" onClick={(event) => event.stopPropagation()}>
                <div className="border-b border-border px-4 py-3">
                    <div className="text-sm font-medium text-foreground">{initialValues ? 'Edit connection' : 'Add connection'}</div>
                    <div className="text-xs text-muted-foreground">Everything is mocked locally.</div>
                </div>
                <div className="grid gap-4 p-4 md:grid-cols-2">
                    <label className="grid gap-2 text-sm">
                        <span className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Name</span>
                        <input
                            className="h-9 border border-border bg-background px-3 outline-none"
                            onChange={(event) => setName(event.target.value)}
                            value={name}
                        />
                    </label>
                    <label className="grid gap-2 text-sm">
                        <span className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Type</span>
                        <select
                            className="h-9 border border-border bg-background px-3 outline-none"
                            onChange={(event) => setType(event.target.value as TConnection['type'])}
                            value={type}
                        >
                            <option>PostgreSQL</option>
                            <option>SQLite</option>
                            <option>libSQL</option>
                            <option>MySQL</option>
                        </select>
                    </label>
                </div>
                <div className="flex items-center justify-end gap-2 border-t border-border px-4 py-3">
                    <AppButton onClick={() => onOpenChange(false)}>Cancel</AppButton>
                    <AppButton
                        icon={Plus}
                        onClick={() => {
                            onSave({ name, type })
                            onOpenChange(false)
                        }}
                        tone="accent"
                    >
                        Save
                    </AppButton>
                </div>
            </div>
        </div>
    )
}

function AiAssistantPanel({
    open,
    onOpenChange,
    activeConnection,
    onApplySql
}: {
    open: boolean
    onOpenChange: (open: boolean) => void
    activeConnection: TConnection
    onApplySql: (sql: string) => void
}) {
    const [input, setInput] = useState('')
    const [messages, setMessages] = useState<TMessage[]>([
        {
            role: 'assistant',
            content: 'Mock assistant ready. I can generate SQL, explain schemas, and apply queries to the editor.'
        }
    ])

    if (!open) return null

    function send() {
        if (!input.trim()) return
        const nextSql = 'select customer_id, sum(total) as revenue from orders group by customer_id order by revenue desc;'
        setMessages((current) => [
            ...current,
            { role: 'user', content: input },
            { role: 'assistant', content: `Generated a schema-aware query for ${activeConnection.name}.` }
        ])
        setInput('')
        onApplySql(nextSql)
    }

    return (
        <aside className="fixed right-0 top-0 z-40 flex h-full w-[420px] max-w-[90vw] flex-col border-l border-border bg-sidebar shadow-2xl">
            <header className="flex items-center gap-2 border-b border-border px-3 py-2">
                <Sparkles className="h-4 w-4 text-primary" />
                <span className="text-xs font-semibold">AI Assistant</span>
                <span className="ml-auto text-[10px] text-muted-foreground">{activeConnection.name}</span>
                <button className="flex h-7 w-7 items-center justify-center" onClick={() => onOpenChange(false)} type="button">
                    <X className="h-3.5 w-3.5" />
                </button>
            </header>
            <div className="flex-1 overflow-auto divide-y divide-border/40">
                {messages.map((message, index) => (
                    <div
                        key={index}
                        className={cn(
                            'px-3 py-3 text-sm',
                            message.role === 'assistant'
                                ? 'bg-sidebar text-foreground'
                                : 'ml-auto max-w-[85%] bg-primary/10 text-foreground'
                        )}
                    >
                        {message.content}
                    </div>
                ))}
            </div>
            <div className="border-t border-border p-3">
                <textarea
                    className="min-h-20 w-full resize-none border border-border bg-background p-3 text-sm outline-none"
                    onChange={(event) => setInput(event.target.value)}
                    onKeyDown={(event) => {
                        if (event.key === 'Enter' && !event.shiftKey) {
                            event.preventDefault()
                            send()
                        }
                    }}
                    placeholder="Ask about schema, SQL, or cleanup..."
                    value={input}
                />
                <div className="mt-2 flex justify-end">
                    <AppButton icon={Bot} onClick={send} tone="accent">
                        Send
                    </AppButton>
                </div>
                <div className="mt-3 flex items-center gap-2">
                    <AppButton icon={Wand2} onClick={() => onApplySql('select * from customers limit 10;')}>
                        Use sample SQL
                    </AppButton>
                </div>
            </div>
        </aside>
    )
}

export default function AppView() {
    const [activeNavId, setActiveNavId] = useState<TViewId>('database-studio')
    const [connections, setConnections] = useState<TConnection[]>(INITIAL_CONNECTIONS)
    const [activeConnectionId, setActiveConnectionId] = useState(INITIAL_CONNECTIONS[0]?.id ?? '')
    const [openTabs, setOpenTabs] = useState<TTab[]>([
        { id: makeTabId(INITIAL_CONNECTIONS[0].id, INITIAL_CONNECTIONS[0].tables[0].id), connectionId: INITIAL_CONNECTIONS[0].id, tableId: INITIAL_CONNECTIONS[0].tables[0].id, label: INITIAL_CONNECTIONS[0].tables[0].name }
    ])
    const [activeTabId, setActiveTabId] = useState<string | null>(openTabs[0]?.id ?? null)
    const [search, setSearch] = useState('')
    const [selectedRows, setSelectedRows] = useState(new Set<number>())
    const [sql, setSql] = useState('select * from customers limit 50;')
    const [queryResult, setQueryResult] = useState<{ columns: string[]; rows: TRow[] } | null>(null)
    const [snippets, setSnippets] = useState<string[]>([
        'select * from customers limit 50;',
        'select status, count(*) from orders group by status;'
    ])
    const [history, setHistory] = useState(INITIAL_HISTORY)
    const [containers, setContainers] = useState(INITIAL_CONTAINERS)
    const [paletteOpen, setPaletteOpen] = useState(false)
    const [paletteQuery, setPaletteQuery] = useState('')
    const [connectionDialogOpen, setConnectionDialogOpen] = useState(false)
    const [assistantOpen, setAssistantOpen] = useState(false)
    const [editingConnectionId, setEditingConnectionId] = useState<string | null>(null)

    const activeConnection = connections.find((connection) => connection.id === activeConnectionId) ?? connections[0]
    const activeTab = openTabs.find((tab) => tab.id === activeTabId) ?? openTabs[0] ?? null
    const activeTable =
        activeTab && activeConnection
            ? activeConnection.tables.find((table) => table.id === activeTab.tableId) ?? activeConnection.tables[0]
            : activeConnection?.tables[0] ?? null

    useEffect(
        function bindShortcuts() {
            function onKeyDown(event: KeyboardEvent) {
                if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
                    event.preventDefault()
                    setPaletteOpen((current) => !current)
                }
                if (event.key === 'Escape') {
                    setPaletteOpen(false)
                }
            }

            window.addEventListener('keydown', onKeyDown)
            return () => window.removeEventListener('keydown', onKeyDown)
        },
        []
    )

    useEffect(
        function keepSelectedTabValid() {
            if (!activeTab && openTabs[0]) {
                setActiveTabId(openTabs[0].id)
            }
        },
        [activeTab, openTabs]
    )

    function updateConnection(nextConnection: TConnection) {
        setConnections((current) => current.map((connection) => (connection.id === nextConnection.id ? nextConnection : connection)))
    }

    function openTable(connectionId: string, tableId: string, label: string) {
        const tabId = makeTabId(connectionId, tableId)
        setActiveConnectionId(connectionId)
        setOpenTabs((current) => {
            if (current.some((tab) => tab.id === tabId)) return current
            return [...current, { id: tabId, connectionId, tableId, label }]
        })
        setActiveTabId(tabId)
        setActiveNavId('database-studio')
    }

    function selectConnection(connectionId: string) {
        const next = connections.find((connection) => connection.id === connectionId)
        if (!next) return
        setActiveConnectionId(connectionId)
        const firstTable = next.tables[0]
        if (firstTable) openTable(connectionId, firstTable.id, firstTable.name)
    }

    function onAddConnection() {
        setEditingConnectionId(null)
        setConnectionDialogOpen(true)
    }

    function saveConnection(values: { name: string; type: TConnection['type'] }) {
        if (editingConnectionId) {
            const existing = connections.find((connection) => connection.id === editingConnectionId)
            if (!existing) return
            updateConnection({
                ...existing,
                name: values.name,
                type: values.type
            })
            return
        }

        const id = `demo-${Date.now()}`
        const next: TConnection = {
            id,
            name: values.name || `Mock ${connections.length + 1}`,
            type: values.type,
            status: 'disconnected',
            color: '#c9a3b5',
            tables: [
                {
                    id: 'public.sample',
                    name: 'sample',
                    schema: 'public',
                    columns: [
                        { name: 'id', type: 'uuid', primary: true },
                        { name: 'name', type: 'text' }
                    ],
                    rows: [{ id: 'sample_1', name: 'New mock row' }]
                }
            ]
        }
        setConnections((current) => [...current, next])
        setActiveConnectionId(id)
        openTable(id, next.tables[0].id, next.tables[0].name)
    }

    function activeConnectionTable() {
        if (!activeConnection || !activeTable) return null
        return activeConnection.tables.find((table) => table.id === activeTable.id) ?? activeConnection.tables[0] ?? null
    }

    const table = activeConnectionTable()

    function patchActiveTable(nextTable: TTable) {
        setConnections((current) =>
            current.map((connection) => {
                if (connection.id !== activeConnectionId) return connection
                return {
                    ...connection,
                    tables: connection.tables.map((item) => (item.id === nextTable.id ? nextTable : item))
                }
            })
        )
    }

    function insertRow() {
        if (!table) return
        const row = Object.fromEntries(
            table.columns.map((column) => [column.name, column.primary ? `new_${Date.now()}` : ''])
        )
        patchActiveTable({ ...table, rows: [row, ...table.rows] })
    }

    function duplicateRows() {
        if (!table) return
        const duplicates = table.rows
            .filter((_, index) => selectedRows.has(index))
            .map((row, index) => ({ ...row, id: `${row.id ?? 'row'}_copy_${index + 1}` }))
        if (duplicates.length === 0) return
        patchActiveTable({ ...table, rows: [...duplicates, ...table.rows] })
        setSelectedRows(new Set())
    }

    function deleteRows() {
        if (!table || selectedRows.size === 0) return
        patchActiveTable({ ...table, rows: table.rows.filter((_, index) => !selectedRows.has(index)) })
        setSelectedRows(new Set())
    }

    function runQuery(nextSql = sql) {
        if (!activeConnection) return
        const result = queryResultFor(activeConnection, nextSql)
        setQueryResult(result)
        setHistory((current) => [
            { id: Date.now(), sql: nextSql, status: 'ok', rows: result.rows.length, duration: 8 + Math.round(Math.random() * 26) },
            ...current
        ])
        setSql(nextSql)
        setActiveNavId('sql-console')
    }

    function saveScript() {
        if (!sql.trim()) return
        setSnippets((current) => [sql, ...current.filter((snippet) => snippet !== sql)])
    }

    function rerunSql(nextSql: string) {
        setSql(nextSql)
        runQuery(nextSql)
    }

    function updateContainer(containerId: string, status: TContainer['status']) {
        setContainers((current) =>
            current.map((container) =>
                container.id === containerId
                    ? {
                          ...container,
                          status,
                          health: status === 'running' ? 'healthy' : status === 'restarting' ? 'starting' : 'none'
                      }
                    : container
            )
        )
        if (status === 'restarting') {
            window.setTimeout(() => {
                setContainers((current) =>
                    current.map((container) =>
                        container.id === containerId
                            ? { ...container, status: 'running', health: 'healthy' }
                            : container
                    )
                )
            }, 900)
        }
    }

    function createContainer() {
        setContainers((current) => [
            ...current,
            {
                id: `pg-${Date.now()}`,
                name: `dora-postgres-${current.length + 1}`,
                image: 'postgres:16',
                port: String(5440 + current.length),
                status: 'running',
                health: 'healthy'
            }
        ])
    }

    function deleteContainer(containerId: string) {
        setContainers((current) => current.filter((container) => container.id !== containerId))
    }

    const paletteActions = useMemo(
        () => [
            {
                id: 'nav-sql-console',
                label: 'Open SQL Console',
                description: 'Switch to the query editor',
                icon: SquareTerminal,
                onSelect: () => setActiveNavId('sql-console')
            },
            {
                id: 'nav-database-studio',
                label: 'Open Data Viewer',
                description: 'Switch to the table browser',
                icon: Table2,
                onSelect: () => setActiveNavId('database-studio')
            },
            {
                id: 'nav-schema-visualizer',
                label: 'Open Schema',
                description: 'Switch to the schema map',
                icon: GitBranch,
                onSelect: () => setActiveNavId('schema-visualizer')
            },
            {
                id: 'nav-docker',
                label: 'Open Docker Manager',
                description: 'Switch to the container manager',
                icon: Boxes,
                onSelect: () => setActiveNavId('docker')
            },
            {
                id: 'nav-settings',
                label: 'Open Settings',
                description: 'Switch to application settings',
                icon: Settings,
                onSelect: () => setActiveNavId('settings')
            },
            ...connections.map((connection) => ({
                id: `connection-${connection.id}`,
                label: `Switch to ${connection.name}`,
                description: formatType(connection.type),
                icon: Database,
                onSelect: () => selectConnection(connection.id)
            })),
            ...((table && activeConnection)
                ? activeConnection.tables.map((item) => ({
                      id: `table-${item.id}`,
                      label: `Open ${item.name}`,
                      description: item.schema,
                      icon: Table2,
                      onSelect: () => openTable(activeConnection.id, item.id, item.name)
                  }))
                : [])
        ],
        [activeConnection, connections, table]
    )

    return (
        <main className="flex h-screen w-full overflow-hidden bg-background text-foreground">
            <NavigationSidebar activeNavId={activeNavId} onNavSelect={setActiveNavId} />
            {activeNavId !== 'settings' ? (
                <ConnectionSidebar
                    activeConnectionId={activeConnectionId}
                    connections={connections}
                    onConnectionSelect={selectConnection}
                    onTableSelect={(tableId, tableName) => openTable(activeConnectionId, tableId, tableName)}
                    selectedTableId={table?.id ?? null}
                />
            ) : null}
            <section className="flex min-w-0 flex-1 flex-col overflow-hidden">
                <header className="flex h-10 items-center justify-between border-b border-border bg-sidebar px-3">
                    <div className="flex items-center gap-2">
                        <button
                            className="flex h-7 w-7 items-center justify-center text-muted-foreground hover:text-foreground"
                            title="Toggle sidebar"
                            type="button"
                        >
                            <PanelLeft className="h-4 w-4" />
                        </button>
                        <span className="px-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                            {NAV_ITEMS.find((item) => item.id === activeNavId)?.label ?? 'Dora'}
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="hidden items-center gap-2 text-xs text-muted-foreground md:flex">
                            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: activeConnection?.color ?? '#999' }} />
                            <span>{activeConnection?.name ?? 'No connection'}</span>
                        </div>
                        <AppButton icon={Command} onClick={() => setPaletteOpen(true)}>
                            Command
                        </AppButton>
                        <AppButton icon={Plus} onClick={onAddConnection} tone="accent">
                            Connection
                        </AppButton>
                    </div>
                </header>
                <div className="min-h-0 flex-1 overflow-hidden">
                    {activeNavId === 'database-studio' ? (
                        activeConnection && table ? (
                            <div className="flex h-full flex-col">
                                <TabBar
                                    activeTabId={activeTabId}
                                    onTabClick={setActiveTabId}
                                    onTabClose={(tabId) => {
                                        setOpenTabs((current) => current.filter((tab) => tab.id !== tabId))
                                        setActiveTabId((current) => {
                                            if (current !== tabId) return current
                                            return openTabs.find((tab) => tab.id !== tabId)?.id ?? current
                                        })
                                    }}
                                    rightSlot={<div className="px-2 text-[10px] uppercase tracking-[0.16em] text-muted-foreground">Tabs</div>}
                                    tabs={openTabs}
                                />
                                <DatabaseStudioView
                                    key={table.id}
                                    onDeleteRows={deleteRows}
                                    onDuplicateRows={duplicateRows}
                                    onInsertRow={insertRow}
                                    search={search}
                                    selectedRows={selectedRows}
                                    setSearch={setSearch}
                                    setSelectedRows={setSelectedRows}
                                    table={table}
                                />
                            </div>
                        ) : (
                            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                                No table selected
                            </div>
                        )
                    ) : null}

                    {activeNavId === 'sql-console' ? (
                        activeConnection ? (
                            <SqlConsoleView
                                connection={activeConnection}
                                history={history}
                                onRerun={rerunSql}
                                onRun={() => runQuery()}
                                onSave={saveScript}
                                onUseSnippet={setSql}
                                result={queryResult}
                                setSql={setSql}
                                snippets={snippets}
                                sql={sql}
                            />
                        ) : (
                            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                                No connection selected
                            </div>
                        )
                    ) : null}

                    {activeNavId === 'schema-visualizer' ? (
                        activeConnection ? (
                            <SchemaVisualizerView connection={activeConnection} />
                        ) : (
                            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                                No connection selected
                            </div>
                        )
                    ) : null}

                    {activeNavId === 'docker' ? (
                        <DockerView
                            containers={containers}
                            onCreate={createContainer}
                            onDelete={deleteContainer}
                            onRestart={(containerId) => updateContainer(containerId, 'restarting')}
                            onStart={(containerId) => updateContainer(containerId, 'running')}
                            onStop={(containerId) => updateContainer(containerId, 'stopped')}
                        />
                    ) : null}

                    {activeNavId === 'settings' ? <SettingsView /> : null}
                </div>
            </section>

            <button
                aria-label="Open AI assistant"
                className={cn(
                    'fixed bottom-4 right-4 z-30 flex h-10 w-10 items-center justify-center border border-border bg-background shadow-lg',
                    assistantOpen && 'hidden'
                )}
                onClick={() => setAssistantOpen(true)}
                type="button"
            >
                <Sparkles className="h-4 w-4" />
            </button>

            <ConnectionDialog
                initialValues={editingConnectionId ? connections.find((connection) => connection.id === editingConnectionId) : undefined}
                onOpenChange={(open) => {
                    setConnectionDialogOpen(open)
                    if (!open) setEditingConnectionId(null)
                }}
                onSave={saveConnection}
                open={connectionDialogOpen}
            />

            <CommandPalette
                actions={paletteActions}
                onAction={() => setPaletteQuery('')}
                onOpenChange={setPaletteOpen}
                open={paletteOpen}
                query={paletteQuery}
                setQuery={setPaletteQuery}
            />

            <AiAssistantPanel
                activeConnection={activeConnection}
                onApplySql={(nextSql) => {
                    setSql(nextSql)
                    setActiveNavId('sql-console')
                }}
                onOpenChange={setAssistantOpen}
                open={assistantOpen}
            />
        </main>
    )
}
