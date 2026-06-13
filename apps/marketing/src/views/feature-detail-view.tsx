import Link from 'next/link'

import { FeatureDemo } from '@/components/feature-demo'
import { ResourcesPageShell } from '@/components/resources-page-shell'
import {
    FEATURES,
    getFeaturePath,
    type TFeatureConfig
} from '@/core/config/features'
import { featureDetailSchema } from '@/core/config/feature-structured-data'

export default function FeatureDetailView({
    feature
}: {
    feature: TFeatureConfig
}) {
    const related = FEATURES.filter(function (item) {
        return item.slug !== feature.slug
    }).slice(0, 3)

    return (
        <>
            <script
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify(featureDetailSchema(feature))
                }}
                type="application/ld+json"
            />
            <ResourcesPageShell
                eyebrow="Features"
                title={feature.title}
                lead={feature.lead}
            >
                <div className="mx-auto max-w-5xl">
                    <nav
                        aria-label="Breadcrumb"
                        className="mb-6 font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground"
                    >
                        <ol className="flex flex-wrap items-center gap-2">
                            <li>
                                <Link
                                    className="transition-colors hover:text-foreground"
                                    href="/features"
                                >
                                    Features
                                </Link>
                            </li>
                            <li aria-hidden="true">/</li>
                            <li className="text-foreground">
                                {feature.menuLabel}
                            </li>
                        </ol>
                    </nav>

                    <FeatureDemo demo={feature.demo} />

                    <article className="mt-10">
                        <div className="grid max-w-3xl gap-4 text-[15px] leading-relaxed text-muted-foreground">
                            {feature.paragraphs.map(function (paragraph) {
                                return <p key={paragraph}>{paragraph}</p>
                            })}
                        </div>

                        <section
                            aria-labelledby="feature-highlights-heading"
                            className="mt-8"
                        >
                            <h2
                                id="feature-highlights-heading"
                                className="mb-4 font-pixel text-lg font-medium text-foreground"
                            >
                                What you get
                            </h2>
                            <ul className="grid gap-3 sm:grid-cols-2">
                                {feature.highlights.map(function (highlight) {
                                    return (
                                        <li
                                            key={highlight}
                                            className="border border-[#2b252c] bg-background/30 px-4 py-3 text-sm leading-relaxed text-muted-foreground"
                                        >
                                            {highlight}
                                        </li>
                                    )
                                })}
                            </ul>
                        </section>

                        <div className="mt-10 flex flex-wrap gap-3">
                            <Link
                                className="inline-flex min-h-10 items-center border border-[#f5c0c0]/50 px-4 text-[13px] text-[#f5c0c0] transition-colors hover:bg-[rgba(245,192,192,0.06)]"
                                href="/downloads"
                            >
                                Download Dora
                            </Link>
                            <Link
                                className="inline-flex min-h-10 items-center border border-[#2b252c] px-4 text-[13px] text-muted-foreground transition-colors hover:border-[#3a3138] hover:text-foreground"
                                href="/app"
                            >
                                Open web demo
                            </Link>
                            <Link
                                className="inline-flex min-h-10 items-center border border-[#2b252c] px-4 text-[13px] text-muted-foreground transition-colors hover:border-[#3a3138] hover:text-foreground"
                                href={`/#${feature.homepageAnchor}`}
                            >
                                View on homepage
                            </Link>
                        </div>
                    </article>

                    <section
                        aria-labelledby="related-features-heading"
                        className="mt-14 border-t border-[#2b252c] pt-10"
                    >
                        <h2
                            id="related-features-heading"
                            className="mb-5 font-pixel text-xl font-medium text-foreground"
                        >
                            More features
                        </h2>
                        <div className="grid gap-3 sm:grid-cols-3">
                            {related.map(function (item) {
                                return (
                                    <Link
                                        key={item.slug}
                                        className="border border-[#2b252c] px-4 py-3 text-sm text-muted-foreground transition-colors hover:border-[#3a3138] hover:text-foreground"
                                        href={getFeaturePath(item.slug)}
                                    >
                                        {item.menuLabel}
                                    </Link>
                                )
                            })}
                        </div>
                    </section>
                </div>
            </ResourcesPageShell>
        </>
    )
}
