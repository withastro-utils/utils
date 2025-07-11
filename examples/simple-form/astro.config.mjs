import {defineConfig} from 'astro/config';
import react from '@astrojs/react';
import astroFormsDebug from "@astro-utils/forms/dist/integration.js";
import node from '@astrojs/node';

// https://astro.build/config
export default defineConfig({
    output: "server",
    adapter: node({
        mode: 'standalone',
    }),
    integrations: [react(), astroFormsDebug]
});
