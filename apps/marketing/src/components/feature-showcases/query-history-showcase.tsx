'use client'

import {
    CheckCircle,
    Clock,
    Download,
    Layers,
    Pin,
    Play,
    Trash2,
    XCircle
} from 'lucide-react'

import { FeatureShowcaseRail } from '@/components/feature-showcases/feature-showcase-rail'
import { useCycleIndex } from '@/components/feature-showcases/use-showcase-motion'

const HISTORY = [
    {
        query: "SELECT * FROM orders WHERE status = 'paid' ORDER BY created_at DESC",
        time: '2m ago',
        duration: '6ms',
        rows: '128',
        success: true,
        pinned: true
    },
    {
        query: 'SELECT status, count(*) AS total FROM orders GROUP BY status',
        time: '8m ago',
        duration: '11ms',
        rows: '4',
        success: true,
        pinned: false
    },
    {
        query: 'SELECT p.name, sum(oi.quantity) AS units FROM products p JOIN order_items oi ON oi.product_id = p.id GROUP BY p.name',
        time: '15m ago',
        duration: '24ms',
        rows: '30',
        success: true,
        pinned: false
    },
    {
        query: 'SELECT * FROM customers ORDER BY created_at DESC LIMIT 25',
        time: '22m ago',
        duration: '8ms',
        rows: '25',
        success: true,
        pinned: false
    },
    {
        query: 'SELECT * FROM unknown_table LIMIT 10',
        time: '31m ago',
        duration: '3ms',
        rows: undefined,
        success: false,
        pinned: false
    }
]

const ACTIVE_QUERY = "SELECT o.id, c.name, o.total\nFROM orders o\nJOIN customers c ON c.id = o.customer_id\nWHERE o.status = 'paid';"

export function QueryHistoryShowcase() {
    const activeIndex = useCycleIndex(HISTORY.length, 2200)
    const activeItem = HISTORY[activeIndex] ?? HISTORY[0]

    return (
        <>
            <FeatureShowcaseRail demo="query-history" />
            <div className="grid min-w-0 flex-1 grid-cols-[minmax(0,1fr)_280px]">
                <div className="flex min-w-0 flex-col bg-background">
                    <div className="flex h-10 items-center gap-3 border-b border-sidebar-border px-3">
                        <div className="rounded-[2px] border border-sidebar-border bg-sidebar-accent/40 px-2.5 py-1 text-[11px] text-foreground">
                            Query 1
                        </div>
                        <div className="rounded-[2px] px-2.5 py-1 text-[11px] text-muted-foreground">
                            + New tab
                        </div>
                        <div className="ml-auto flex items-center gap-1.5 rounded-[2px] bg-primary px-2.5 py-1 text-[11px] text-primary-foreground">
                            <Play className="h-3 w-3" />
                            Run
                        </div>
                    </div>
                    <div className="flex-1 overflow-hidden p-4 font-mono text-[12px] leading-6">
                        {activeItem.query.split('\n').length === 1
                            ? activeItem.query
                                  .replace(
                                      /(.{48})/g,
                                      '$1\n'
                                  )
                                  .split('\n')
                                  .map(function (line, index) {
                                      return (
                                          <div
                                              key={index}
                                              className="whitespace-pre"
                                          >
                                              <span className="mr-4 inline-block w-4 select-none text-right text-muted-foreground/40">
                                                  {index + 1}
                                              </span>
                                              <span className="text-foreground/90">
                                                  {line}
                                              </span>
                                          </div>
                                      )
                                  })
                            : ACTIVE_QUERY.split('\n').map(function (
                                  line,
                                  index
                              ) {
                                  return (
                                      <div
                                          key={index}
                                          className="whitespace-pre"
                                      >
                                          <span className="mr-4 inline-block w-4 select-none text-right text-muted-foreground/40">
                                              {index + 1}
                                          </span>
                                          <span className="text-foreground/90">
                                              {line}
                                          </span>
                                      </div>
                                  )
                              })}
                    </div>
                    <div className="flex h-8 items-center gap-3 border-t border-sidebar-border px-3 text-[10px] text-muted-foreground">
                        <span>Demo E-Commerce</span>
                        <span>•</span>
                        <span>libSQL</span>
                        <span className="ml-auto">Ready</span>
                    </div>
                </div>
                <aside className="flex flex-col border-l border-sidebar-border bg-sidebar">
                    <div className="flex items-center justify-between border-b border-sidebar-border px-3 py-2">
                        <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <span className="text-xs font-medium">History</span>
                        </div>
                        <div className="flex items-center gap-0.5">
                            <span className="flex h-6 w-6 items-center justify-center rounded-[2px] bg-sidebar-accent text-primary">
                                <Layers className="h-3.5 w-3.5" />
                            </span>
                            <span className="flex h-6 w-6 items-center justify-center rounded-[2px] text-muted-foreground">
                                <Download className="h-3.5 w-3.5" />
                            </span>
                            <span className="flex h-6 w-6 items-center justify-center rounded-[2px] text-muted-foreground">
                                <Trash2 className="h-3.5 w-3.5" />
                            </span>
                        </div>
                    </div>
                    <div className="border-b border-sidebar-border px-3 py-2">
                        <div className="h-7 rounded-[2px] border border-input bg-background px-2 text-[11px] leading-7 text-muted-foreground">
                            Search history…
                        </div>
                    </div>
                    <div className="flex-1 overflow-hidden">
                        {HISTORY.map(function (item, index) {
                            const active = index === activeIndex
                            return (
                                <div
                                    key={item.query}
                                    className={
                                        'border-b border-sidebar-border/50 px-3 py-2 transition-colors duration-500 ' +
                                        (active
                                            ? 'bg-sidebar-accent/50'
                                            : 'hover:bg-sidebar-accent/30')
                                    }
                                >
                                    <div className="flex items-start gap-2">
                                        {item.success ? (
                                            <CheckCircle className="mt-0.5 h-3 w-3 shrink-0 text-green-500" />
                                        ) : (
                                            <XCircle className="mt-0.5 h-3 w-3 shrink-0 text-red-500" />
                                        )}
                                        <span className="flex-1 break-all font-mono text-[11px] leading-snug text-sidebar-foreground">
                                            {item.query}
                                        </span>
                                        {item.pinned ? (
                                            <Pin className="h-3 w-3 shrink-0 text-primary" />
                                        ) : null}
                                    </div>
                                    <div className="ml-5 mt-1 flex items-center gap-2 text-[10px] text-muted-foreground">
                                        <span>{item.time}</span>
                                        <span>•</span>
                                        <span>{item.duration}</span>
                                        {item.rows ? (
                                            <>
                                                <span>•</span>
                                                <span>{item.rows} rows</span>
                                            </>
                                        ) : null}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </aside>
            </div>
        </>
    )
}
