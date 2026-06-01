'use client'

import dynamic from 'next/dynamic'

import { useInView } from '@/shared/hooks/use-in-view'
import type { GitHubStatsData } from '@/core/github/get-github-stats'

const GitHubStats = dynamic(
    () => import('@/components/github-stats').then((m) => m.GitHubStats),
    { ssr: false }
)

export function DeferredGitHubStats({ data }: { data: GitHubStatsData }) {
    const [ref, inView] = useInView<HTMLDivElement>({
        rootMargin: '320px 0px',
        threshold: 0
    })

    return (
        <div ref={ref} className="min-h-[320px]">
            {inView ? <GitHubStats data={data} /> : null}
        </div>
    )
}
