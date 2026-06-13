'use client'

import { FeatureShowcase } from '@/components/feature-showcases'
import type { TFeatureDemo } from '@/core/config/features'

export function FeatureDemo({ demo }: { demo: TFeatureDemo }) {
    return <FeatureShowcase demo={demo} />
}
