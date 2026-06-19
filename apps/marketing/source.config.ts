import { defineConfig, defineDocs } from 'fumadocs-mdx/config'

export const docs = defineDocs({
    dir: '../../docs',
    docs: {
        files: [
            'index.mdx',
            'installation.mdx',
            'api.mdx',
            'types.mdx',
            'guides/*.mdx'
        ]
    },
    meta: {
        files: ['meta.json', 'guides/meta.json']
    }
})

export default defineConfig()
