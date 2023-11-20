import { defineConfig } from 'astro/config'
import preact from '@astrojs/preact'
import tailwind from '@astrojs/tailwind'

// https://astro.build/config
export default defineConfig({
    // Enable Preact to support Preact JSX components.
    integrations: [preact(), tailwind()],
})
