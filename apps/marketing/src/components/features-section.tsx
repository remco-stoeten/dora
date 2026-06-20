'use client'

import { useRef, useEffect, useState, type ReactNode } from 'react'

import { CornerTick } from '@/components/corner-tick'
import { SectionFrame } from '@/components/section-frame'
import { useScrollMotion } from '@/components/features/use-scroll-motion'
import { DatabaseConnectionCard } from '@/components/features/database-connection-card'
import { RegionGlobeCard } from '@/components/features/region-globe-card'
import { NativePerformanceCard } from '@/components/features/native-performance-card'
import { PasteConnectCard } from '@/components/features/paste-connect-card'
import { DockerContainersCard } from '@/components/features/docker-containers-card'
import { MultiConnectionCard } from '@/components/features/multi-connection-card'
import { SchemaDiagramCard } from '@/components/features/schema-diagram-card'
import { ScrollReveal } from '@/components/scroll-reveal'
import { usePageVisible } from '@/shared/hooks/use-page-visible'
import { usePrefersReducedMotion } from '@/shared/hooks/use-prefers-reduced-motion'

const FEATURE_CELL_CLASS =
    'relative min-h-[300px] scroll-mt-28 border-r border-b border-line overflow-hidden transition-colors duration-[450ms] ease-out hover:bg-[rgba(245,192,192,0.06)]'
const FEATURE_REVEAL_CLASS = 'flex h-full w-full'

function FeatureCell({
    id,
    delay,
    children
}: {
    id: string
    delay: number
    children: ReactNode
}) {
    return (
        <div id={id} className={FEATURE_CELL_CLASS}>
            <ScrollReveal className={FEATURE_REVEAL_CLASS} delay={delay}>
                {children}
            </ScrollReveal>
        </div>
    )
}

export function FeaturesSection() {
    const sectionRef = useRef<HTMLElement>(null)
    const [isInView, setIsInView] = useState(false)
    const pageVisible = usePageVisible()
    const reducedMotion = usePrefersReducedMotion()
    const animate = isInView && pageVisible && !reducedMotion
    const motion = useScrollMotion(sectionRef, { active: animate })

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                const visible = entry.isIntersecting
                setIsInView(visible)
            },
            { rootMargin: '160px 0px', threshold: 0.1 }
        )
        if (sectionRef.current) observer.observe(sectionRef.current)
        return () => observer.disconnect()
    }, [])

    return (
        <section
            id="features"
            ref={sectionRef}
            className="relative w-full"
        >
            <SectionFrame />
            <div className="border-b border-r border-line px-6 py-12 sm:px-8">
                <ScrollReveal delay={40}>
                    <h2 className="mb-1 font-[family-name:var(--font-pixel)] text-2xl font-light italic text-ink-600">
                        More Than a GUI.
                    </h2>
                    <h3 className="font-[family-name:var(--font-pixel)] text-3xl font-semibold text-ink-100">
                        The Interface Databases Deserve.
                    </h3>
                </ScrollReveal>
            </div>

            <div className="relative grid grid-cols-2 md:grid-cols-3 md:grid-rows-2">
                <CornerTick className="hidden md:block left-0 top-1/2 -translate-x-1/2 -translate-y-1/2" />
                <CornerTick className="hidden md:block left-1/3 top-1/2 -translate-x-1/2 -translate-y-1/2" />
                <CornerTick className="hidden md:block left-2/3 top-1/2 -translate-x-1/2 -translate-y-1/2" />
                <CornerTick className="hidden md:block left-full top-1/2 -translate-x-1/2 -translate-y-1/2" />
                <FeatureCell id="feature-multi-database" delay={0}>
                    <DatabaseConnectionCard animate={animate} motion={motion} />
                </FeatureCell>
                <FeatureCell id="feature-regions" delay={55}>
                    <RegionGlobeCard animate={animate} motion={motion} />
                </FeatureCell>
                <FeatureCell id="feature-docker" delay={110}>
                    <DockerContainersCard animate={animate} />
                </FeatureCell>
                <FeatureCell id="feature-schema" delay={165}>
                    <SchemaDiagramCard animate={animate} />
                </FeatureCell>
                <FeatureCell id="feature-performance" delay={220}>
                    <NativePerformanceCard animate={animate} motion={motion} />
                </FeatureCell>
                <FeatureCell id="feature-paste-connect" delay={275}>
                    <PasteConnectCard animate={animate} />
                </FeatureCell>
            </div>

            <div
                id="feature-multi-connection"
                className="relative min-h-[260px] scroll-mt-28 border-b border-r border-line overflow-hidden transition-colors duration-[450ms] ease-out hover:bg-[rgba(245,192,192,0.06)]"
            >
                <ScrollReveal className="flex h-full w-full" delay={330}>
                    <MultiConnectionCard animate={animate} />
                </ScrollReveal>
            </div>
        </section>
    )
}
