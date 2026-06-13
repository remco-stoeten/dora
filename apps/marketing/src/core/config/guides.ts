import type { TRouteConfig } from '@/core/config/routes'

export type TGuideStep = {
    title: string
    body: string
}

export type TGuideConfig = {
    slug: string
    provider: string
    logo: string
    engine: 'PostgreSQL' | 'libSQL'
    title: string
    description: string
    lead: string
    keywords: string[]
    connectionString: string
    intro: string[]
    steps: TGuideStep[]
    notes: string[]
}

export const GUIDES_INDEX = {
    path: '/docs',
    title: 'Dora docs',
    description:
        'Connection guides and setup docs for Dora — connect Supabase, Neon, Turso, and any Postgres or libSQL database to the desktop app.',
    lead: 'Step-by-step guides for connecting your databases to Dora. Pick your host below — anything that speaks Postgres or libSQL works the same way.'
} as const

export const GUIDES: TGuideConfig[] = [
    {
        slug: 'supabase',
        provider: 'Supabase',
        logo: '/providers/supabase.svg',
        engine: 'PostgreSQL',
        title: 'Connect Supabase to Dora',
        description:
            'Connect a Supabase Postgres database to Dora, the desktop database GUI. Paste the Supabase connection string, browse tables, and run SQL — no extra config.',
        lead: 'Supabase is hosted Postgres, so Dora connects to it with the standard connection string. Here is how to find yours and open it in the app.',
        keywords: [
            'supabase gui',
            'supabase desktop client',
            'supabase database gui',
            'connect supabase postgres',
            'supabase sql client'
        ],
        connectionString:
            'postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres',
        intro: [
            'Every Supabase project is a full Postgres database. Dora talks to it over the same protocol as any other Postgres host — there is no Supabase-specific setup, you just need the connection string.',
            'Once connected, you get the full Dora workbench: the data viewer, schema browser, and Monaco SQL editor over your Supabase tables.'
        ],
        steps: [
            {
                title: 'Open the connection settings in Supabase',
                body: 'In the Supabase dashboard, go to Project Settings → Database. Find the "Connection string" section and select the URI tab.'
            },
            {
                title: 'Copy the connection string',
                body: 'Copy the URI. It looks like postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres. Replace [PASSWORD] with your database password (the one you set when creating the project).'
            },
            {
                title: 'Add a connection in Dora',
                body: 'In Dora, create a new connection and paste the string. Dora parses the host, port, user, and database out of it automatically — you do not need to fill the fields by hand.'
            },
            {
                title: 'Test and connect',
                body: 'Hit test to confirm Dora can reach the database, then connect. Your schemas and tables appear in the sidebar.'
            }
        ],
        notes: [
            'Supabase requires SSL — Dora connects over SSL by default for Supabase hosts.',
            'For IPv4 networks or serverless use, Supabase also offers a connection pooler host (aws-0-[region].pooler.supabase.com). The pooled string works in Dora the same way; use session mode (port 5432) for a desktop client.',
            'Your database password is separate from your Supabase account password. Reset it under Project Settings → Database if you have lost it.'
        ]
    },
    {
        slug: 'neon',
        provider: 'Neon',
        logo: '/providers/neon.svg',
        engine: 'PostgreSQL',
        title: 'Connect Neon to Dora',
        description:
            'Connect a Neon serverless Postgres database to Dora, the desktop database GUI. Paste the Neon connection string, browse branches, and run SQL.',
        lead: 'Neon is serverless Postgres. Dora connects with the connection string from your Neon dashboard — here is where to find it.',
        keywords: [
            'neon database client',
            'neon postgres gui',
            'connect neon database',
            'neon desktop client',
            'neon sql client'
        ],
        connectionString:
            'postgresql://[USER]:[PASSWORD]@[ENDPOINT].neon.tech/[DBNAME]?sslmode=require',
        intro: [
            'Neon is standard Postgres with a serverless, branchable backend. From a client like Dora, it behaves exactly like any other Postgres database — paste the string and go.',
            'Each Neon branch has its own connection string, so you can point Dora at production, a preview branch, or a throwaway branch independently.'
        ],
        steps: [
            {
                title: 'Open Connection Details in Neon',
                body: 'In the Neon Console, open your project and find the "Connection Details" widget on the dashboard. Pick the branch and database you want to connect to.'
            },
            {
                title: 'Copy the connection string',
                body: 'Copy the connection string. It looks like postgresql://[USER]:[PASSWORD]@[ENDPOINT].neon.tech/[DBNAME]?sslmode=require. Reveal and include the password.'
            },
            {
                title: 'Add a connection in Dora',
                body: 'Create a new connection in Dora and paste the string. Dora reads the host, database, user, and the sslmode parameter automatically.'
            },
            {
                title: 'Test and connect',
                body: 'Test the connection, then connect. Neon tables and schemas load into the sidebar.'
            }
        ],
        notes: [
            'Neon requires SSL (sslmode=require). Keep that parameter in the string and Dora will connect securely.',
            'Neon offers a pooled connection (an endpoint with a -pooler suffix) and a direct one. For a desktop GUI, the direct endpoint is usually the right choice.',
            'To inspect a different branch, copy that branch’s connection string from the Console and add it as a separate connection in Dora.'
        ]
    },
    {
        slug: 'turso',
        provider: 'Turso',
        logo: '/providers/libsql.svg',
        engine: 'libSQL',
        title: 'Connect Turso to Dora',
        description:
            'Connect a Turso libSQL database to Dora, the desktop database GUI. Use the libsql:// URL and an auth token to browse and query your edge database.',
        lead: 'Turso runs libSQL (a SQLite fork). Dora connects with the database URL and an auth token from the Turso CLI — here is how.',
        keywords: [
            'turso desktop client',
            'turso gui',
            'libsql client',
            'connect turso database',
            'turso sql client'
        ],
        connectionString: 'libsql://[DATABASE]-[ORG].turso.io?authToken=[TOKEN]',
        intro: [
            'Turso databases speak libSQL, a fork of SQLite with a network protocol. Dora has a native libSQL path, so you connect with a URL plus an auth token instead of a username and password.',
            'You get the data viewer and SQL editor over your remote Turso database, the same as you would for a local SQLite file.'
        ],
        steps: [
            {
                title: 'Get the database URL',
                body: 'Run turso db show [DATABASE] in your terminal. Copy the URL — it looks like libsql://[DATABASE]-[ORG].turso.io.'
            },
            {
                title: 'Create an auth token',
                body: 'Run turso db tokens create [DATABASE] to mint a token. Copy it — Dora uses this in place of a password.'
            },
            {
                title: 'Add a connection in Dora',
                body: 'Create a new libSQL connection in Dora. Paste the libsql:// URL and the auth token (or paste the full libsql://...?authToken=... string and Dora will split it out).'
            },
            {
                title: 'Test and connect',
                body: 'Test, then connect. Your Turso tables appear in the sidebar, ready to browse and query.'
            }
        ],
        notes: [
            'Auth tokens can be scoped and rotated. If a connection stops working, mint a fresh token with turso db tokens create.',
            'You can also point Dora at a local libSQL/SQLite file — the same engine, no token needed.',
            'Install the Turso CLI from the Turso docs if you do not have it; the dashboard can also surface the database URL.'
        ]
    }
]

const guideBySlug = new Map(GUIDES.map((guide) => [guide.slug, guide]))

export function getGuide(slug: string): TGuideConfig | undefined {
    return guideBySlug.get(slug)
}

export function getGuidePath(slug: string): string {
    return `/docs/connect/${slug}`
}

export function getGuideRouteEntries(): TRouteConfig[] {
    return GUIDES.map(function (guide) {
        return {
            path: getGuidePath(guide.slug),
            title: guide.title,
            description: guide.description,
            sitemap: true,
            index: true,
            priority: 0.7,
            changeFrequency: 'monthly' as const
        }
    })
}
