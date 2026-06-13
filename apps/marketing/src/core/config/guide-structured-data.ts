import { absoluteUrl } from '@/core/config/seo'
import { getGuidePath, type TGuideConfig } from '@/core/config/guides'

export function guideHowToSchema(guide: TGuideConfig) {
    return {
        '@context': 'https://schema.org',
        '@type': 'HowTo',
        name: guide.title,
        description: guide.description,
        url: absoluteUrl(getGuidePath(guide.slug)),
        step: guide.steps.map(function (step, index) {
            return {
                '@type': 'HowToStep',
                position: index + 1,
                name: step.title,
                text: step.body
            }
        })
    }
}

export function guideBreadcrumbSchema(guide: TGuideConfig) {
    return {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
            {
                '@type': 'ListItem',
                position: 1,
                name: 'Docs',
                item: absoluteUrl('/docs')
            },
            {
                '@type': 'ListItem',
                position: 2,
                name: guide.provider,
                item: absoluteUrl(getGuidePath(guide.slug))
            }
        ]
    }
}
