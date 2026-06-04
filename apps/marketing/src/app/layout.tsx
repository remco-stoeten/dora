import type { Metadata, Viewport } from 'next'
import localFont from 'next/font/local'
import type { ReactNode } from 'react'
import { GeistMono } from 'geist/font/mono'
import { GeistSans } from 'geist/font/sans'

import { siteConfig } from '@/core/config/site'
import '@/core/three-suppress'

import './globals.css'

const PixelFont = localFont({
    src: './fonts/GeistPixel-Square.woff2',
    variable: '--font-geist-pixel-square',
    weight: '500',
    fallback: [
        'Geist Mono',
        'ui-monospace',
        'SFMono-Regular',
        'Roboto Mono',
        'Menlo',
        'Monaco',
        'Liberation Mono',
        'DejaVu Sans Mono',
        'Courier New',
        'monospace'
    ],
    adjustFontFallback: false
})

export const metadata: Metadata = {
    metadataBase: new URL(siteConfig.url),
    applicationName: siteConfig.name,
    title: {
        default: siteConfig.name,
        template: `%s | ${siteConfig.name}`
    },
    description: siteConfig.description,
    icons: {
        icon: [
            { url: '/favicon.ico', sizes: 'any' },
            { url: '/icons/icon.png', type: 'image/png' }
        ],
        apple: [{ url: '/apple-icon.png' }]
    }
}

export const viewport: Viewport = {
    width: 'device-width',
    initialScale: 1,
    themeColor: siteConfig.themeColor
}

type TRootProps = {
    children: ReactNode
}

export default function RootLayout({ children }: TRootProps) {
    return (
        <html
            className={`${GeistSans.variable} ${GeistMono.variable} ${PixelFont.variable} dark`}
            lang="en"
            suppressHydrationWarning
        >
            <body>
                <main className="min-h-screen bg-background text-foreground">
                    {children}
                </main>
            </body>
        </html>
    )
}
