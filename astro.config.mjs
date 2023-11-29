import { defineConfig } from 'astro/config'
import preact from '@astrojs/preact'
import tailwind from '@astrojs/tailwind'
import lit from '@astrojs/lit'

// https://astro.build/config
export default defineConfig({
    // Enable Preact to support Preact JSX components.
    integrations: [preact({ include: ['**/*[jt]sx'] }), tailwind(), lit()],
    server: {
        host: '0.0.0.0',
    },
})
