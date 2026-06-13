import Link from 'next/link'

import { FooterFrame } from '@/components/footer-frame'
import { ScrollReveal } from '@/components/scroll-reveal'

const FOOTER_LINKS = [
    { label: 'GitHub Profile', href: 'https://github.com/remcostoeten', external: true },
    { label: 'Repository', href: 'https://github.com/remcostoeten/dora', external: true },
    { label: 'Features', href: '/features', external: false },
    { label: 'Docs', href: '/docs', external: false },
    { label: 'Changelog', href: '/changelog', external: false },
] as const

function FooterLink({ href, label, external }: (typeof FOOTER_LINKS)[number]) {
    const className =
        'border-0 text-xs text-muted-foreground outline-none transition-colors duration-150 hover:text-foreground focus-visible:text-foreground'

    if (external) {
        return (
            <a
                className={className}
                href={href}
                rel="noreferrer"
                target="_blank"
            >
                {label}
            </a>
        )
    }

    return (
        <Link className={className} href={href}>
            {label}
        </Link>
    )
}

function renderLink(link: (typeof FOOTER_LINKS)[number]) {
    return <FooterLink key={link.label} {...link} />
}

export function Footer() {
    const year = new Date().getFullYear()

    return (
        <section className="marketing-container marketing-footer relative">
            <FooterFrame />
            <footer className="flex items-center justify-between px-5 py-4">
                <div className="flex flex-col gap-1">
                    <ScrollReveal delay={0} rootMargin="0px">
                        <span className="text-xs text-muted-foreground">
                            Engineered by{' '}
                            <a
                                href="https://remcostoeten.nl"
                                target="_blank"
                                rel="noreferrer"
                                className="border-0 text-xs text-muted-foreground outline-none transition-colors duration-150 hover:text-foreground focus-visible:text-foreground"
                            >
                                Remco Stoeten
                            </a>
                        </span>
                    </ScrollReveal>
                    <ScrollReveal delay={50} rootMargin="0px">
                        <span className="text-xs text-muted-foreground/60">
                            &copy; {year} Dora. All rights reserved.
                        </span>
                    </ScrollReveal>
                </div>

                <ScrollReveal delay={100} rootMargin="0px">
                    <nav
                        aria-label="Footer navigation"
                        className="flex flex-wrap items-center gap-6"
                    >
                        {FOOTER_LINKS.map(renderLink)}
                    </nav>
                </ScrollReveal>
            </footer>
        </section>
    )
}
