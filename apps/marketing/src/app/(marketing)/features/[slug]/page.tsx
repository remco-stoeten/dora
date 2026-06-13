import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { FEATURES, getFeature, getFeaturePath } from '@/core/config/features'
import { createMetadata } from '@/core/config/seo'
import FeatureDetailView from '@/views/feature-detail-view'

type TPageProps = {
    params: Promise<{ slug: string }>
}

export function generateStaticParams() {
    return FEATURES.map(function (feature) {
        return { slug: feature.slug }
    })
}

export async function generateMetadata({
    params
}: TPageProps): Promise<Metadata> {
    const { slug } = await params
    const feature = getFeature(slug)

    if (!feature) {
        return {}
    }

    return createMetadata({
        path: getFeaturePath(feature.slug),
        title: feature.title,
        description: feature.description,
        keywords: feature.keywords
    })
}

export default async function Page({ params }: TPageProps) {
    const { slug } = await params
    const feature = getFeature(slug)

    if (!feature) {
        notFound()
    }

    return <FeatureDetailView feature={feature} />
}
