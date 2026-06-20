import Link from 'next/link'

import { ResourcesPageShell } from '@/components/resources-page-shell'

export default function NotFound() {
    return (
        <ResourcesPageShell
            eyebrow="404"
            title="Page not found"
            lead="This Dora page does not exist."
        >
            <Link
                className="inline-flex min-h-10 items-center border border-accent-pink/50 px-5 text-[13px] text-accent-pink transition-colors hover:bg-[rgba(245,192,192,0.06)]"
                href="/"
            >
                Go home
            </Link>
        </ResourcesPageShell>
    )
}
