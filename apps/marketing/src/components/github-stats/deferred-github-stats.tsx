'use client'

import dynamic from 'next/dynamic'

import { CornerTick } from '@/components/corner-tick'
import { useInView } from '@/shared/hooks/use-in-view'
import type { GitHubStatsData } from '@/core/github/get-github-stats'

const GitHubStats = dynamic(
    () => import('@/components/github-stats').then((m) => m.GitHubStats),
    { ssr: false, loading: () => <GitHubStatsFrame /> }
)

function GitHubStatsFrame() {
    return (
        <div className="w-full bg-[#0a0a0a]">
            <div className="relative overflow-hidden border border-[#3a3138]">
                <CornerTick className="-left-px -top-px -translate-x-1/2 -translate-y-1/2" />
                <CornerTick className="-right-px -top-px translate-x-1/2 -translate-y-1/2" />
                <CornerTick className="-bottom-px -left-px -translate-x-1/2 translate-y-1/2" />
                <CornerTick className="-bottom-px -right-px translate-x-1/2 translate-y-1/2" />
                <div className="flex flex-col sm:flex-row">
                    <div className="min-h-[150px] w-full flex-shrink-0 border-b border-[#1a1a1a] sm:min-h-[120px] sm:w-1/3 sm:border-b-0 sm:border-r" />
                    <div className="min-h-[150px] flex-1 sm:min-h-[120px]" />
                </div>
                <div className="min-h-[112px] border-t border-[#1a1a1a]" />
            </div>
        </div>
    )
}

export function DeferredGitHubStats({ data }: { data: GitHubStatsData }) {
    const [ref, inView] = useInView<HTMLDivElement>({
        rootMargin: '320px 0px',
        threshold: 0
    })

    return (
        <div ref={ref}>
            {inView ? <GitHubStats data={data} /> : <GitHubStatsFrame />}
        </div>
    )
}
