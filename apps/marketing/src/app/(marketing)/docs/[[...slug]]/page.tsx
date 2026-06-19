import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import {
    DocsBody,
    DocsDescription,
    DocsPage,
    DocsTitle
} from 'fumadocs-ui/layouts/docs/page'
import { createRelativeLink } from 'fumadocs-ui/mdx'
import type { TOCItemType } from 'fumadocs-core/toc'
import type { MDXContent } from 'mdx/types.js'

import { getMDXComponents } from '@/components/mdx-components'
import { createMetadata } from '@/core/config/seo'
import { source } from '@/lib/source'

type MdxPageData = {
    body: MDXContent
    toc: TOCItemType[]
    title?: string
    description?: string
}

type Props = {
    params: Promise<{
        slug?: string[]
    }>
}

export function generateStaticParams() {
    return source.generateParams()
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { slug } = await params
    const page = source.getPage(slug)

    if (!page) {
        return {}
    }

    return createMetadata({
        path: page.url,
        title: page.data.title ?? 'Dora docs',
        description: page.data.description ?? 'Documentation for Dora.'
    })
}

export default async function Page({ params }: Props) {
    const { slug } = await params
    const page = source.getPage(slug)

    if (!page) {
        notFound()
    }

    const data = page.data as MdxPageData
    const MDX = data.body

    return (
        <DocsPage toc={data.toc}>
            <DocsTitle className="font-pixel text-[2rem] font-medium leading-tight tracking-normal text-foreground">
                {data.title}
            </DocsTitle>
            <DocsDescription className="max-w-2xl text-[15px] leading-relaxed text-muted-foreground">
                {data.description}
            </DocsDescription>
            <DocsBody className="dora-docs-body">
                <MDX
                    components={getMDXComponents({
                        a: createRelativeLink(source, page)
                    })}
                />
            </DocsBody>
        </DocsPage>
    )
}
