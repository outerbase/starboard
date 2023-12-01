import { defineConfig } from 'astro/config'
import tailwind from '@astrojs/tailwind'
import lit from '@astrojs/lit'

// https://astro.build/config
export default defineConfig({
    integrations: [tailwind(), lit()],
    server: {
        host: '0.0.0.0',
    },
})
