import { absoluteUrl } from '@/core/config/seo'
import { siteConfig } from '@/core/config/site'
import {
    FEATURES,
    FEATURES_INDEX,
    getFeaturePath,
    type TFeatureConfig
} from '@/core/config/features'

export function featureIndexSchema() {
    return {
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        name: FEATURES_INDEX.title,
        description: FEATURES_INDEX.description,
        url: absoluteUrl(FEATURES_INDEX.path),
        isPartOf: {
            '@type': 'WebSite',
            name: siteConfig.name,
            url: siteConfig.url
        },
        hasPart: FEATURES.map(function (feature) {
            return {
                '@type': 'WebPage',
                name: feature.title,
                description: feature.description,
                url: absoluteUrl(getFeaturePath(feature.slug))
            }
        })
    }
}

export function featureDetailSchema(feature: TFeatureConfig) {
    return {
        '@context': 'https://schema.org',
        '@type': 'WebPage',
        name: feature.title,
        description: feature.description,
        url: absoluteUrl(getFeaturePath(feature.slug)),
        isPartOf: {
            '@type': 'WebSite',
            name: siteConfig.name,
            url: siteConfig.url
        },
        breadcrumb: {
            '@type': 'BreadcrumbList',
            itemListElement: [
                {
                    '@type': 'ListItem',
                    position: 1,
                    name: 'Features',
                    item: absoluteUrl('/features')
                },
                {
                    '@type': 'ListItem',
                    position: 2,
                    name: feature.menuLabel,
                    item: absoluteUrl(getFeaturePath(feature.slug))
                }
            ]
        }
    }
}
