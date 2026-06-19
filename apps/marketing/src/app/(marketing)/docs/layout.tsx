import type { ReactNode } from 'react'
import { RootProvider } from 'fumadocs-ui/provider/next'
import { DocsLayout as FumadocsLayout } from 'fumadocs-ui/layouts/docs'

import { source } from '@/lib/source'

export default function DocsLayout({ children }: { children: ReactNode }) {
    return (
        <RootProvider
            theme={{
                forcedTheme: 'dark'
            }}
        >
            <div className="dora-docs">
                <FumadocsLayout
                    nav={{
                        enabled: false,
                        title: 'Dora docs',
                        url: '/docs'
                    }}
                    searchToggle={{
                        enabled: true
                    }}
                    themeSwitch={{
                        enabled: false
                    }}
                    tree={source.pageTree}
                >
                    {children}
                </FumadocsLayout>
            </div>
        </RootProvider>
    )
}
