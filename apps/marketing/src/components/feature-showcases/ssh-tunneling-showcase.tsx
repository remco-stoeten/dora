'use client'

import { CheckCircle2, Lock, Server } from 'lucide-react'

import { FeatureShowcaseRail } from '@/components/feature-showcases/feature-showcase-rail'

const TUNNEL_STEPS = [
    { label: 'Resolving jump host', done: true },
    { label: 'SSH handshake', done: true },
    { label: 'Opening port forward  5432 → localhost:5432', done: true },
    { label: 'Connecting to database', done: true }
] as const

export function SshTunnelingShowcase() {
    return (
        <>
            <FeatureShowcaseRail demo="ssh-tunneling" />
            <div className="flex min-w-0 flex-1 flex-col bg-background">
                <div className="flex h-10 items-center gap-3 border-b border-sidebar-border px-4">
                    <Lock className="h-3.5 w-3.5 text-emerald-400" />
                    <span className="text-xs font-medium text-foreground">
                        SSH Tunnel
                    </span>
                    <span className="ml-auto rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-medium text-emerald-400">
                        Connected
                    </span>
                </div>

                <div className="flex flex-1 flex-col gap-4 overflow-auto p-4">
                    <div className="rounded-lg border border-sidebar-border bg-sidebar/40 p-3">
                        <p className="mb-2 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                            Jump host
                        </p>
                        <div className="flex items-center gap-2">
                            <Server className="h-4 w-4 shrink-0 text-muted-foreground" />
                            <div className="min-w-0">
                                <p className="truncate font-mono text-xs text-foreground">
                                    bastion.prod.internal
                                </p>
                                <p className="text-[10px] text-muted-foreground">
                                    Port 22 · Key auth · ubuntu
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-lg border border-sidebar-border bg-sidebar/40 p-3">
                        <p className="mb-2 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                            Target database
                        </p>
                        <div className="flex items-center gap-2">
                            <div className="min-w-0">
                                <p className="truncate font-mono text-xs text-foreground">
                                    db-primary.internal:5432
                                </p>
                                <p className="text-[10px] text-muted-foreground">
                                    PostgreSQL · prod-analytics
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-lg border border-sidebar-border bg-sidebar/40 p-3">
                        <p className="mb-3 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                            Tunnel established
                        </p>
                        <div className="flex flex-col gap-2">
                            {TUNNEL_STEPS.map(function (step) {
                                return (
                                    <div
                                        key={step.label}
                                        className="flex items-center gap-2"
                                    >
                                        <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-400" />
                                        <span className="font-mono text-[11px] text-foreground/80">
                                            {step.label}
                                        </span>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                </div>

                <div className="flex h-9 items-center gap-4 border-t border-sidebar-border px-4 text-[10px]">
                    <span className="inline-flex items-center gap-1 text-emerald-400">
                        <Lock className="h-3 w-3" />
                        Encrypted tunnel active
                    </span>
                    <span className="ml-auto text-muted-foreground">
                        localhost:5432
                    </span>
                </div>
            </div>
        </>
    )
}
