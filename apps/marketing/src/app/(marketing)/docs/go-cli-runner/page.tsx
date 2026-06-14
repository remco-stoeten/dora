import type { Metadata } from 'next'

import { createMetadata } from '@/core/config/seo'
import { getRoute } from '@/core/config/routes'
import { GoCliRunnerView } from '@/views'

const route = getRoute('/docs/go-cli-runner')

export const metadata: Metadata = createMetadata({
    path: route.path,
    title: route.title,
    description: route.description,
    keywords: [
        'golang cli runner',
        'go cli runner',
        'bubble tea cli',
        'golang tui',
        'qemu libvirt runner',
        'github actions dispatch cli'
    ]
})

export default function Page() {
    return <GoCliRunnerView />
}
