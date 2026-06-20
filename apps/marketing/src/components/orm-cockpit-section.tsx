'use client'

import Link from 'next/link'
import { useEffect, useRef, useState, type ReactNode } from 'react'

import { CornerTick } from '@/components/corner-tick'
import { SectionFrame } from '@/components/section-frame'
import { OrmCockpitCard } from '@/components/features/orm-cockpit-card'
import { ScrollReveal } from '@/components/scroll-reveal'
import { getFeaturePath } from '@/core/config/features'
import { usePageVisible } from '@/shared/hooks/use-page-visible'
import { usePrefersReducedMotion } from '@/shared/hooks/use-prefers-reduced-motion'

const CELL_CLASS =
    'relative min-h-[340px] scroll-mt-28 border-r border-b border-line overflow-hidden transition-colors duration-[450ms] ease-out hover:bg-[rgba(245,192,192,0.06)]'

function Token({ children }: { children: string }) {
    return (
        <code className="rounded-[3px] border border-line bg-surface-deeper px-1 py-px font-mono text-[11px] text-[#cdb4bd] [font-family:var(--font-geist-mono),ui-monospace,monospace]">
            {children}
        </code>
    )
}

const POINTS: { head: string; body: ReactNode }[] = [
    {
        head: 'Link a project folder',
        body: (
            <>
                Point Dora at a repo. It detects <Token>Drizzle</Token> or{' '}
                <Token>Prisma</Token> and parses the schema in place — no
                codegen, no generated client, no Node runtime.
            </>
        )
    },
    {
        head: 'Diff against the live database',
        body: 'Dora introspects the connected database and compares it to your code schema, table by table, column by column.'
    },
    {
        head: 'Every change, graded',
        body: 'Each drift is tagged safe, review, or destructive — so a new nullable column reads differently from a dropped one.'
    },
    {
        head: 'Preview the migration — gated',
        body: (
            <>
                Generate dialect-correct SQL with destructive operations
                commented out until you opt in. Nothing runs from here: hand it
                to the SQL console, where the usual production guardrails apply.
            </>
        )
    }
]

/* ---------------------------------------------------------------------------
 * ORM Cockpit — a standalone row that answers "how do I keep code and database
 * in sync": link a Drizzle / Prisma project, diff its schema against the live
 * database, and preview a migration that reconciles the two.
 * ------------------------------------------------------------------------- */
export function OrmCockpitSection() {
    const sectionRef = useRef<HTMLElement>(null)
    const [isInView, setIsInView] = useState(false)
    const pageVisible = usePageVisible()
    const reducedMotion = usePrefersReducedMotion()
    const animate = isInView && pageVisible && !reducedMotion

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => setIsInView(entry.isIntersecting),
            { rootMargin: '160px 0px', threshold: 0.1 }
        )
        if (sectionRef.current) observer.observe(sectionRef.current)
        return () => observer.disconnect()
    }, [])

    return (
        <section ref={sectionRef} className="relative w-full">
            <SectionFrame />

            <div className="border-b border-r border-line px-6 py-12 sm:px-8">
                <ScrollReveal delay={40}>
                    <h2 className="mb-1 font-[family-name:var(--font-pixel)] text-2xl font-light italic text-ink-600">
                        Your schema lives in code. Your data lives in the
                        database.
                    </h2>
                    <h3 className="text-balance font-[family-name:var(--font-pixel)] text-3xl font-semibold text-ink-100">
                        Diff the drift. Preview the migration.
                    </h3>
                </ScrollReveal>
            </div>

            <div className="relative grid grid-cols-1 md:grid-cols-2">
                <CornerTick className="hidden md:block left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" />
                <CornerTick className="hidden md:block left-1/2 top-0 -translate-x-1/2 -translate-y-1/2" />
                <CornerTick className="hidden md:block left-1/2 bottom-0 -translate-x-1/2 translate-y-1/2" />

                <div className={`${CELL_CLASS} flex`}>
                    <ScrollReveal className="flex h-full w-full" delay={0}>
                        <div className="flex h-full w-full flex-col justify-center gap-5 px-6 py-10 sm:px-8">
                            {POINTS.map((point) => (
                                <div key={point.head} className="flex gap-3">
                                    <span
                                        aria-hidden
                                        className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full"
                                        style={{ backgroundColor: '#f5c0c0' }}
                                    />
                                    <div className="min-w-0">
                                        <p className="font-[family-name:var(--font-pixel)] text-[13px] font-medium text-[#e8e0e8]">
                                            {point.head}
                                        </p>
                                        <p className="mt-0.5 text-xs leading-relaxed text-ink-500">
                                            {point.body}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </ScrollReveal>
                </div>

                <div id="feature-orm-cockpit" className={`${CELL_CLASS} flex`}>
                    <ScrollReveal className="flex h-full w-full" delay={90}>
                        <OrmCockpitCard animate={animate} />
                    </ScrollReveal>
                    <Link
                        className="absolute bottom-4 right-4 z-10 text-[11px] text-accent-violet transition-colors hover:text-accent-pink"
                        href={getFeaturePath('orm-cockpit')}
                    >
                        Learn more →
                    </Link>
                </div>
            </div>
        </section>
    )
}
