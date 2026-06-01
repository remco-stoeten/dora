import {
    ChevronLeft,
    ChevronRight,
    Clock,
    Columns3,
    Download,
    Edit3,
    FileJson,
    Filter,
    Minus,
    PanelLeft,
    Plus,
    RefreshCw,
    Sparkles,
    Square,
    Table as TableIcon,
    X
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

/**
 * Static replica of the real /app main panel (tab bar, studio toolbar, data grid,
 * status bar). Class strings are copied from the studio components (tab-bar,
 * window-controls, studio-toolbar, data-grid, bottom-status-bar).
 */

type TColumn = { name: string; type: string }

const columns: TColumn[] = [
    { name: 'id', type: 'serial' },
    { name: 'name', type: 'varchar(100)' },
    { name: 'email', type: 'varchar(255)' },
    { name: 'phone', type: 'varchar(20)' },
    { name: 'city', type: 'varchar(50)' },
    { name: 'country', type: 'varchar(50)' },
    { name: 'created_at', type: 'timestamp' }
]

const rows: string[][] = [
    ['1', 'Emma Johnson', 'emma.johnson@example.com', '+1-415-552-8841', 'San Diego', 'USA', '2025-11-04 09:12:48'],
    ['2', 'Liam Williams', 'liam.williams@example.com', '+1-312-845-1190', 'Chicago', 'Canada', '2025-09-22 17:40:11'],
    ['3', 'Olivia Garcia', 'olivia.garcia@example.com', '+1-602-771-3360', 'Phoenix', 'UK', '2026-01-15 11:03:27'],
    ['4', 'Noah Martinez', 'noah.martinez@example.com', '+1-214-908-7725', 'Dallas', 'Germany', '2025-12-30 08:55:02'],
    ['5', 'Ava Davis', 'ava.davis@example.com', '+1-718-334-2098', 'New York', 'France', '2025-10-18 22:14:39'],
    ['6', 'Elijah Wilson', 'elijah.wilson@example.com', '+1-512-667-4410', 'Austin', 'Australia', '2026-02-09 14:27:50'],
    ['7', 'Sophia Brown', 'sophia.brown@example.com', '+1-619-220-9913', 'San Jose', 'Netherlands', '2025-08-27 06:48:16'],
    ['8', 'James Miller', 'james.miller@example.com', '+1-704-558-1276', 'Charlotte', 'Sweden', '2026-03-01 19:31:44'],
    ['9', 'Isabella Lopez', 'isabella.lopez@example.com', '+1-215-870-6652', 'Philadelphia', 'USA', '2025-11-19 13:09:05'],
    ['10', 'Oliver Anderson', 'oliver.anderson@example.com', '+1-832-441-3389', 'Houston', 'Norway', '2025-12-12 10:52:33']
]

const GRID_COLS = 'grid-cols-[36px_60px_170px_236px_158px_126px_114px_180px]'

function GridCheckbox() {
    return (
        <div className="flex items-center justify-center border-b border-r border-l border-sidebar-border bg-background">
            <span className="h-3.5 w-3.5 rounded-[3px] border border-muted-foreground/40" />
        </div>
    )
}

function renderHead(column: TColumn) {
    return (
        <div
            key={column.name}
            className="flex items-baseline gap-1.5 px-3 py-2 overflow-hidden border-b border-r border-sidebar-border"
        >
            <span className="text-foreground text-xs font-sans shrink-0">{column.name}</span>
            <span className="text-muted-foreground/50 text-[10px] font-mono lowercase truncate">
                {column.type}
            </span>
        </div>
    )
}

function renderRow(row: string[], rowIndex: number) {
    function renderCell(cell: string, cellIndex: number) {
        const focused = rowIndex === 0 && cellIndex === 1
        const tone = cellIndex === 0 ? 'text-muted-foreground tabular-nums' : 'text-foreground/90'
        const focus = focused ? ' relative ring-1 ring-inset ring-primary/70' : ''
        return (
            <div
                key={cellIndex}
                className={
                    'px-3 py-[9px] overflow-hidden text-ellipsis whitespace-nowrap border-b border-r border-sidebar-border ' +
                    tone +
                    focus
                }
            >
                {cell}
            </div>
        )
    }

    return (
        <div key={row[0]} className={'group grid ' + GRID_COLS + ' hover:bg-sidebar-accent/40'}>
            <GridCheckbox />
            {row.map(renderCell)}
        </div>
    )
}

function WindowControls() {
    return (
        <div className="flex h-full shrink-0 items-center border-l border-border px-1">
            <div className="flex items-center gap-1 text-sidebar-foreground/80">
                <span className="flex h-7 w-7 items-center justify-center rounded-md">
                    <Minus className="h-4 w-4" />
                </span>
                <span className="flex h-7 w-7 items-center justify-center rounded-md">
                    <Square className="h-3.5 w-3.5" />
                </span>
                <span className="flex h-7 w-7 items-center justify-center rounded-md">
                    <X className="h-4 w-4" />
                </span>
            </div>
        </div>
    )
}

function GhostButton({ icon: Icon, label, iconClass }: { icon: LucideIcon; label: string; iconClass?: string }) {
    return (
        <span className="inline-flex items-center gap-1.5 h-7 px-2 rounded-md text-xs text-muted-foreground whitespace-nowrap">
            <Icon className={'h-3.5 w-3.5 shrink-0 ' + (iconClass ?? '')} />
            <span>{label}</span>
        </span>
    )
}

export function DemoMain() {
    return (
        <main className="flex-1 flex flex-col h-full overflow-hidden relative">
            {/* Tab bar + window controls — h-12 to line up with the sidebar's
                connection-switcher header so the divider runs straight across. */}
            <div className="flex items-center h-12 border-b border-border bg-sidebar shrink-0 select-none">
                <div className="flex h-full min-w-0 flex-1 items-center overflow-hidden">
                    <div className="flex items-center h-full shrink-0 border-r border-border bg-background text-foreground">
                        <span className="flex items-center gap-1.5 h-full px-2 pl-3 text-xs font-medium">
                            <span className="max-w-[120px] truncate">customers</span>
                        </span>
                        <span className="h-full flex items-center px-1 pr-2 text-muted-foreground">
                            <X className="h-3 w-3" />
                        </span>
                    </div>
                </div>
                <WindowControls />
            </div>

            {/* Studio toolbar */}
            <div className="flex items-center h-10 pr-2 gap-2 text-sm bg-sidebar border-b border-sidebar-border shrink-0">
                <div className="flex items-center gap-1 mr-2 pl-2">
                    <span className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground">
                        <PanelLeft className="h-3.5 w-3.5" />
                    </span>
                    <div className="h-4 w-px bg-sidebar-border mx-1" />
                    <div className="flex items-center bg-sidebar-accent/50 rounded-md p-0.5">
                        <span className="flex h-6 w-6 items-center justify-center rounded-sm bg-sidebar-accent text-sidebar-foreground shadow-xs">
                            <TableIcon className="h-3.5 w-3.5" />
                        </span>
                        <span className="flex h-6 w-6 items-center justify-center rounded-sm text-muted-foreground">
                            <FileJson className="h-3.5 w-3.5" />
                        </span>
                    </div>
                    <div className="h-4 w-px bg-sidebar-border mx-1" />
                    <GhostButton icon={Filter} label="Filters" />
                    <GhostButton icon={Columns3} label="Columns" />
                </div>

                <div className="flex-1" />

                <div className="flex items-center gap-2">
                    <GhostButton icon={Edit3} label="Dry Edit" />
                    <GhostButton icon={Sparkles} label="Seed Data" iconClass="text-blue-400" />
                    <span className="inline-flex items-center gap-1 h-7 px-2 rounded-md text-xs font-medium bg-primary text-primary-foreground mr-2 whitespace-nowrap">
                        <Plus className="h-3.5 w-3.5 shrink-0" />
                        <span>Add record</span>
                    </span>
                    <div className="h-4 w-px bg-sidebar-border mx-1" />
                    <span className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground">
                        <RefreshCw className="h-3.5 w-3.5" />
                    </span>
                    <span className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground">
                        <Download className="h-3.5 w-3.5" />
                    </span>
                </div>
            </div>

            {/* Data grid */}
            <div className="flex-1 min-h-0 overflow-hidden">
                <div className="min-w-[1080px] text-xs font-mono">
                    <div className={'grid ' + GRID_COLS + ' bg-sidebar'}>
                        <GridCheckbox />
                        {columns.map(renderHead)}
                    </div>
                    {rows.map(renderRow)}
                </div>
            </div>

            {/* Bottom status bar */}
            <div className="flex items-center justify-between h-10 px-3 bg-sidebar border-t border-sidebar-border shrink-0">
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5" />
                        3ms
                    </span>
                    <div className="h-3 w-px bg-sidebar-border" />
                    <span>Showing 1-50 of 50 rows</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                    <span className="flex items-center gap-1.5">
                        <span className="text-muted-foreground">Limit:</span>
                        <span className="flex items-center justify-center h-6 w-16 rounded-md border border-input text-center tabular-nums">
                            50
                        </span>
                    </span>
                    <span className="flex items-center gap-1.5">
                        <span className="text-muted-foreground">Offset:</span>
                        <span className="flex items-center justify-center h-6 w-16 rounded-md border border-input text-center tabular-nums">
                            0
                        </span>
                    </span>
                    <span className="text-muted-foreground">Page 1 of 1</span>
                    <div className="flex items-center rounded-md border border-input">
                        <span className="flex h-6 w-6 items-center justify-center border-r border-input text-muted-foreground">
                            <ChevronLeft className="h-3.5 w-3.5" />
                        </span>
                        <span className="flex h-6 w-6 items-center justify-center text-muted-foreground">
                            <ChevronRight className="h-3.5 w-3.5" />
                        </span>
                    </div>
                </div>
            </div>

            {/* Floating AI assistant button */}
            <div className="absolute bottom-4 right-4 z-10 flex h-10 w-10 items-center justify-center rounded-full border border-border bg-background shadow-lg">
                <Sparkles className="h-4 w-4 text-foreground" />
            </div>
        </main>
    )
}
