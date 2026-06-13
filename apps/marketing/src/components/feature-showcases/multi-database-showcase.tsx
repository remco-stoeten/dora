'use client'

import {
    ChevronsUpDown,
    Database,
    Pencil,
    Search,
    Trash2
} from 'lucide-react'

import { FeatureShowcaseRail } from '@/components/feature-showcases/feature-showcase-rail'
import { useCycleIndex } from '@/components/feature-showcases/use-showcase-motion'

const CONNECTIONS = [
    {
        name: 'Demo E-Commerce',
        type: 'Turso',
        date: 'Jun 5, 2026',
        active: true
    },
    {
        name: 'Production API',
        type: 'PostgreSQL',
        date: 'Jun 4, 2026',
        active: false
    },
    {
        name: 'Analytics Warehouse',
        type: 'PostgreSQL',
        date: 'May 28, 2026',
        active: false
    },
    {
        name: 'MariaDB Replica',
        type: 'MariaDB',
        date: 'Jun 3, 2026',
        active: false
    },
    {
        name: 'Staging',
        type: 'MySQL',
        date: 'Jun 1, 2026',
        active: false
    },
    {
        name: 'CockroachDB Cluster',
        type: 'CockroachDB',
        date: 'Jun 2, 2026',
        active: false
    },
    {
        name: 'Local Dev',
        type: 'SQLite',
        date: 'Jun 5, 2026',
        active: false
    }
]

const TABLES = [
    { name: 'customers', count: '50,241' },
    { name: 'products', count: '25,118' },
    { name: 'orders', count: '100,492' },
    { name: 'order_items', count: '150,773' },
    { name: 'inventory', count: '120,336' }
]

export function MultiDatabaseShowcase() {
    const activeIndex = useCycleIndex(CONNECTIONS.length, 2800)
    const activeConnection = CONNECTIONS[activeIndex] ?? CONNECTIONS[0]

    return (
        <>
            <FeatureShowcaseRail demo="database-connection" />
            <div className="grid min-w-0 flex-1 grid-cols-[244px_minmax(0,1fr)]">
                <div className="flex flex-col border-r border-sidebar-border bg-sidebar">
                    <div className="relative shrink-0 border-b border-sidebar-border">
                        <button
                            type="button"
                            className="flex h-10 w-full items-center gap-2 border-b border-sidebar-border px-3 text-left"
                        >
                            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[2px] border border-primary/30 bg-primary/5">
                                <Database className="h-3.5 w-3.5 text-muted-foreground" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <div className="truncate text-sm font-medium text-foreground">
                                    {activeConnection.name}
                                </div>
                                <div className="truncate text-[10px] text-muted-foreground/80">
                                    {activeConnection.type} •{' '}
                                    {activeConnection.date}
                                </div>
                            </div>
                            <ChevronsUpDown className="h-4 w-4 shrink-0 text-muted-foreground" />
                        </button>
                        <div className="absolute left-0 right-0 top-full z-20 border border-sidebar-border bg-popover shadow-xl">
                            <div className="border-b border-sidebar-border p-2">
                                <div className="relative">
                                    <Search className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                                    <div className="h-8 rounded-[2px] border border-input bg-background pl-8 pr-2 text-xs leading-8 text-muted-foreground">
                                        Search connections…
                                    </div>
                                </div>
                            </div>
                            <div className="max-h-[220px] overflow-hidden py-1">
                                {CONNECTIONS.map(function (connection, index) {
                                    const active = index === activeIndex
                                    return (
                                        <div
                                            key={connection.name}
                                            className={
                                                'group/row relative ml-10 flex cursor-default items-center gap-2.5 rounded-[2px] p-1.5 transition-colors duration-500 ' +
                                                (active
                                                    ? 'bg-sidebar-accent/40'
                                                    : 'hover:bg-sidebar-accent')
                                            }
                                        >
                                            <div
                                                className={
                                                    'flex h-7 w-7 shrink-0 items-center justify-center rounded-[2px] border transition-colors duration-500 ' +
                                                    (active
                                                        ? 'border-primary/30 bg-primary/5'
                                                        : 'border-sidebar-border bg-background')
                                                }
                                            >
                                                <Database className="h-3.5 w-3.5 text-muted-foreground" />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <div
                                                    className={
                                                        'truncate text-sm transition-colors duration-500 ' +
                                                        (active
                                                            ? 'font-medium text-foreground'
                                                            : 'text-foreground/90')
                                                    }
                                                >
                                                    {connection.name}
                                                </div>
                                                <div className="truncate text-[10px] text-muted-foreground/80">
                                                    {connection.type} •{' '}
                                                    {connection.date}
                                                </div>
                                            </div>
                                            <div className="ml-auto flex items-center gap-0.5 opacity-60">
                                                <span className="flex h-6 w-6 items-center justify-center rounded-[2px] text-muted-foreground">
                                                    <Pencil className="h-3 w-3" />
                                                </span>
                                                <span className="flex h-6 w-6 items-center justify-center rounded-[2px] text-muted-foreground">
                                                    <Trash2 className="h-3 w-3" />
                                                </span>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    </div>
                    <div className="border-b border-sidebar-border px-3 py-2">
                        <div className="relative">
                            <Search className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                            <div className="h-8 rounded-[2px] border border-input bg-background pl-8 text-xs leading-8 text-muted-foreground">
                                Filter tables…
                            </div>
                        </div>
                    </div>
                    <div className="flex-1 overflow-hidden py-1">
                        {TABLES.map(function (table, index) {
                            return (
                                <div
                                    key={table.name}
                                    className={
                                        'flex cursor-default items-center justify-between px-3 py-1.5 text-sm transition-colors ' +
                                        (index === 0
                                            ? 'bg-sidebar-accent/50 text-foreground'
                                            : 'text-sidebar-foreground/90 hover:bg-sidebar-accent/40')
                                    }
                                >
                                    <span className="font-mono text-xs">
                                        {table.name}
                                    </span>
                                    <span className="text-[10px] tabular-nums text-muted-foreground">
                                        {table.count}
                                    </span>
                                </div>
                            )
                        })}
                    </div>
                </div>
                <div className="flex min-w-0 flex-col bg-background">
                    <div className="flex h-10 items-center gap-2 border-b border-sidebar-border px-4">
                        <span className="text-xs text-muted-foreground">
                            customers
                        </span>
                        <span className="text-[10px] text-muted-foreground/60">
                            • 50,241 rows
                        </span>
                    </div>
                    <div className="grid grid-cols-[60px_1fr_1.2fr_100px] border-b border-sidebar-border bg-sidebar/30 text-xs">
                        {['id', 'name', 'email', 'city'].map(function (col) {
                            return (
                                <div
                                    key={col}
                                    className="border-r border-sidebar-border px-3 py-2 font-sans text-foreground last:border-r-0"
                                >
                                    {col}
                                </div>
                            )
                        })}
                    </div>
                    {[
                        ['1', 'Emma Johnson', 'emma@example.com', 'San Diego'],
                        ['2', 'Liam Williams', 'liam@example.com', 'Chicago'],
                        ['3', 'Olivia Garcia', 'olivia@example.com', 'Phoenix']
                    ].map(function (row) {
                        return (
                            <div
                                key={row[0]}
                                className="grid grid-cols-[60px_1fr_1.2fr_100px] border-b border-sidebar-border/70 text-xs"
                            >
                                {row.map(function (cell, index) {
                                    return (
                                        <div
                                            key={index}
                                            className={
                                                'truncate border-r border-sidebar-border/70 px-3 py-2 last:border-r-0 ' +
                                                (index === 0
                                                    ? 'text-muted-foreground tabular-nums'
                                                    : 'text-foreground/90')
                                            }
                                        >
                                            {cell}
                                        </div>
                                    )
                                })}
                            </div>
                        )
                    })}
                </div>
            </div>
        </>
    )
}
