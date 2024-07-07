import {defineConfig} from 'astro/config';
import react from '@astrojs/react';
import astroFormsDebug from "@astro-utils/forms/dist/integration.js";

// https://astro.build/config
export default defineConfig({
    output: "server",
    integrations: [react(), astroFormsDebug]
});
