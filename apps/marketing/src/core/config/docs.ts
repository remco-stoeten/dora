import type { TRouteConfig } from '@/core/config/routes'
import { source } from '@/lib/source'

export function getDocsRouteEntries(): TRouteConfig[] {
    return source
        .getPages()
        .filter((page) => page.url !== '/docs')
        .map((page) => ({
            path: page.url,
            title: page.data.title ?? 'Dora docs',
            description: page.data.description ?? 'Documentation for Dora.',
            sitemap: true,
            index: true,
            priority: 0.55,
            changeFrequency: 'monthly'
        }))
}
