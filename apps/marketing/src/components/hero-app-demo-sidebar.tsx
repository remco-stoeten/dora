import {
    ChevronsUpDown as ChevronsExpand,
    Container,
    Filter,
    Network,
    RefreshCw,
    Settings,
    SquareTerminal,
    Table2
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { DoraLogo } from '@dora/studio/components/dora-logo'
import { Postgres } from '@dora/studio/components/provider.icons'

/**
 * Static replica of the real /app left rail + database sidebar. Class strings are
 * copied from the studio components (navigation-sidebar, connection-switcher,
 * table-search, table-list) so it renders against the same dark design tokens.
 */

type TTable = { name: string; count: string }

/** Tables + row counts from the e-commerce demo schema that `/app` loads by default. */
const tables: TTable[] = [
    { name: 'customers', count: '50' },
    { name: 'products', count: '25' },
    { name: 'orders', count: '100' },
    { name: 'order_items', count: '150' },
    { name: 'inventory', count: '120' },
    { name: 'transactions', count: '250' },
    { name: 'subscriptions', count: '60' }
]

const railItems: LucideIcon[] = [SquareTerminal, Table2, Network, Container]

function RailButton({
    icon: Icon,
    active,
    bottom
}: {
    icon: LucideIcon
    active?: boolean
    bottom?: boolean
}) {
    const state = active
        ? 'bg-sidebar-accent/80 text-sidebar-accent-foreground ring-1 ring-sidebar-border/70 shadow-sm'
        : 'text-sidebar-foreground'
    return (
        <div className={bottom ? 'mx-auto mt-auto flex flex-col gap-1' : undefined}>
            <div
                className={
                    'relative flex h-10 w-10 items-center justify-center rounded-md transition-colors ' +
                    state
                }
            >
                <Icon className="h-5 w-5" aria-hidden="true" />
            </div>
        </div>
    )
}

function renderRail(Icon: LucideIcon, index: number) {
    return <RailButton key={index} icon={Icon} active={index === 1} />
}

function renderTable(table: TTable) {
    const active = table.name === 'customers'
    return (
        <div
            key={table.name}
            className={
                'group flex items-center gap-2 px-2 py-1.5 transition-colors ' +
                (active ? 'bg-sidebar-accent' : '')
            }
        >
            <Table2 className="h-4 w-4 text-muted-foreground shrink-0" />
            <span className="flex-1 text-sm text-sidebar-foreground truncate">{table.name}</span>
            <span className="text-xs text-muted-foreground tabular-nums shrink-0">{table.count}</span>
        </div>
    )
}

export function DemoSidebar() {
    return (
        <>
            {/* Navigation rail */}
            <aside className="flex h-full w-16 flex-col bg-sidebar border-r border-sidebar-border">
                {/* Logo header — fixed h-12 + bottom border so the rail's top
                    divider continues the connection-switcher / tab-bar line
                    straight across all three columns. */}
                <div className="flex h-12 items-center justify-center border-b border-sidebar-border shrink-0">
                    <DoraLogo size={26} variant="neutral" />
                </div>
                <nav className="flex flex-1 flex-col gap-1 p-2">
                    <div className="mx-auto flex flex-col gap-1">{railItems.map(renderRail)}</div>
                    <RailButton icon={Settings} bottom />
                </nav>
            </aside>

            {/* Database sidebar */}
            <div className="relative flex flex-col h-full w-[244px] bg-sidebar border-r border-sidebar-border select-none">
                {/* Connection-switcher header: fixed h-12 + bottom border so it
                    aligns with the main panel's tab bar across the divide. */}
                <div className="group/trigger relative w-full h-12 px-2 text-left flex items-center gap-3 text-sidebar-foreground border-b border-sidebar-border shrink-0">
                    <div className="flex h-9 w-9 items-center justify-center rounded-md shrink-0 bg-primary/10 text-primary">
                        <Postgres className="h-4 w-4" />
                    </div>
                    <div className="grid flex-1 min-w-0 text-left text-sm leading-tight">
                        <span className="truncate font-semibold text-foreground">
                            Demo E-Commerce (PostgreSQL)
                        </span>
                        <span className="truncate text-xs text-muted-foreground">
                            PostgreSQL • localhost
                        </span>
                    </div>
                    <ChevronsExpand className="ml-auto h-4 w-4 shrink-0 text-muted-foreground" />
                </div>

                {/* Search row: fixed h-10 + bottom border to align with the
                    main panel's studio toolbar. */}
                <div className="flex items-center gap-1.5 px-2 h-10 border-b border-sidebar-border shrink-0">
                    <div className="relative flex-1 flex items-center h-8 px-3 rounded-md border border-sidebar-border/60 text-sm text-muted-foreground/70">
                        Search tables...
                    </div>
                    <div className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground shrink-0">
                        <Filter className="h-4 w-4" />
                    </div>
                    <div className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground shrink-0">
                        <RefreshCw className="h-4 w-4" />
                    </div>
                </div>

                <div className="flex flex-col py-1 flex-1 overflow-hidden">{tables.map(renderTable)}</div>
            </div>
        </>
    )
}
