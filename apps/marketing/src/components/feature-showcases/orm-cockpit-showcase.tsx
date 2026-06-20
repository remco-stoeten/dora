'use client'

import { FolderGit2, RefreshCw, Wand2 } from 'lucide-react'

import { FeatureShowcaseRail } from '@/components/feature-showcases/feature-showcase-rail'
import { useCycleIndex } from '@/components/feature-showcases/use-showcase-motion'

type TConf = 'safe' | 'review' | 'destructive'

const CONF: Record<
    TConf,
    { label: string; fg: string; bg: string; bd: string }
> = {
    safe: {
        label: 'safe',
        fg: '#6fb98a',
        bg: 'rgba(111,185,138,0.12)',
        bd: 'rgba(111,185,138,0.32)'
    },
    review: {
        label: 'review',
        fg: '#d2a86a',
        bg: 'rgba(210,168,106,0.12)',
        bd: 'rgba(210,168,106,0.32)'
    },
    destructive: {
        label: 'destructive',
        fg: '#d18a8a',
        bg: 'rgba(209,138,138,0.12)',
        bd: 'rgba(209,138,138,0.32)'
    }
}

type TDrift = {
    sign: '+' | '~' | '−'
    table: string
    col: string
    detail: string
    conf: TConf
}

const DRIFT: TDrift[] = [
    {
        sign: '+',
        table: 'users',
        col: 'last_login',
        detail: 'add nullable · timestamptz',
        conf: 'safe'
    },
    {
        sign: '+',
        table: 'orders',
        col: 'idx_status',
        detail: 'add index',
        conf: 'safe'
    },
    {
        sign: '~',
        table: 'posts',
        col: 'status',
        detail: 'varchar(20) → text',
        conf: 'review'
    },
    {
        sign: '−',
        table: 'sessions',
        col: 'legacy_token',
        detail: 'drop column',
        conf: 'destructive'
    }
]

// Each SQL line is tied back to the drift row it came from, so the highlight
// walks the diff and its generated statement in lockstep.
const SQL_LINES: { text: string; drift: number; comment?: boolean }[] = [
    {
        text: 'ALTER TABLE "users" ADD COLUMN "last_login" timestamptz;',
        drift: 0
    },
    { text: 'CREATE INDEX "idx_status" ON "orders" ("status");', drift: 1 },
    { text: 'ALTER TABLE "posts" ALTER COLUMN "status" TYPE text;', drift: 2 },
    { text: '', drift: -1 },
    {
        text: '-- ⚠ destructive · review before running',
        drift: 3,
        comment: true
    },
    {
        text: '-- ALTER TABLE "sessions" DROP COLUMN "legacy_token";',
        drift: 3,
        comment: true
    }
]

export function OrmCockpitShowcase() {
    const activeDrift = useCycleIndex(DRIFT.length, 1100)

    return (
        <>
            <FeatureShowcaseRail demo="orm-cockpit" />
            <div className="flex min-w-0 flex-1 flex-col">
                {/* Header — linked project + actions */}
                <div className="flex h-10 items-center gap-2 border-b border-sidebar-border px-3">
                    <FolderGit2 className="h-4 w-4 text-accent-violet" />
                    <span className="font-mono text-[11px] text-foreground/90">
                        apps/web/db
                    </span>
                    <span className="text-foreground/30">·</span>
                    <span className="rounded-[2px] border border-accent-rose/40 bg-accent-rose/10 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.12em] text-accent-rose">
                        drizzle
                    </span>
                    <span className="ml-auto inline-flex items-center gap-1 rounded-[2px] border border-sidebar-border px-2 py-1 text-[10px] text-muted-foreground">
                        <RefreshCw className="h-3 w-3" />
                        Refresh
                    </span>
                    <span className="inline-flex items-center gap-1.5 rounded-[2px] bg-emerald-600/90 px-2.5 py-1 text-[10px] text-white">
                        <Wand2 className="h-3 w-3" />
                        Generate migration
                    </span>
                </div>

                <div className="grid min-w-0 flex-1 grid-cols-2">
                    {/* Schema drift */}
                    <div className="flex min-h-0 flex-col border-r border-sidebar-border">
                        <div className="flex items-center justify-between border-b border-sidebar-border px-3 py-2 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                            <span>Schema drift</span>
                            <span>{DRIFT.length} changes</span>
                        </div>
                        <div className="flex-1 divide-y divide-sidebar-border/60">
                            {DRIFT.map((row, i) => {
                                const conf = CONF[row.conf]
                                const on = i === activeDrift
                                return (
                                    <div
                                        key={`${row.table}.${row.col}`}
                                        className="flex items-center gap-2 px-3 py-2 font-mono text-[11px] transition-colors duration-300"
                                        style={{
                                            backgroundColor: on
                                                ? 'rgba(245,192,192,0.05)'
                                                : 'transparent'
                                        }}
                                    >
                                        <span
                                            className="w-2 shrink-0 text-center font-bold"
                                            style={{ color: conf.fg }}
                                        >
                                            {row.sign}
                                        </span>
                                        <span className="shrink-0 text-foreground/90">
                                            {row.table}
                                            <span className="text-foreground/40">
                                                .
                                            </span>
                                            <span className="text-accent-mauve">
                                                {row.col}
                                            </span>
                                        </span>
                                        <span className="truncate text-[10px] text-muted-foreground">
                                            {row.detail}
                                        </span>
                                        <span
                                            className="ml-auto shrink-0 rounded-[2px] border px-1.5 py-px text-[9px] uppercase tracking-[0.08em]"
                                            style={{
                                                color: conf.fg,
                                                backgroundColor: conf.bg,
                                                borderColor: conf.bd
                                            }}
                                        >
                                            {conf.label}
                                        </span>
                                    </div>
                                )
                            })}
                        </div>
                    </div>

                    {/* Migration preview */}
                    <div className="flex min-h-0 flex-col bg-[#0a0a0a]">
                        <div className="border-b border-sidebar-border px-3 py-2 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                            Migration preview · postgres
                        </div>
                        <div className="flex-1 overflow-hidden p-3 font-mono text-[11px] leading-relaxed">
                            {SQL_LINES.map((line, index) => {
                                const on =
                                    line.drift === activeDrift &&
                                    line.drift >= 0
                                return (
                                    <div
                                        key={index}
                                        className="whitespace-pre rounded-[2px] px-1 transition-colors duration-300"
                                        style={{
                                            color: line.comment
                                                ? '#d18a8a'
                                                : 'rgba(230,224,232,0.85)',
                                            backgroundColor: on
                                                ? 'rgba(245,192,192,0.06)'
                                                : 'transparent'
                                        }}
                                    >
                                        {line.text || ' '}
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}
