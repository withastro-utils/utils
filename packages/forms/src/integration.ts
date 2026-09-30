import { fileURLToPath } from 'node:url';
import { formIdTransform } from './integration/plugins/form-id-transform/index.js';
import { RELOAD_WINDOW_PLUGIN } from './integration/plugins/reload-window.js';

export default {
    name: '@astro-utils/forms',
    hooks: {
        'astro:config:setup'({ updateConfig, config }) {
            const root = fileURLToPath(config.root);
            updateConfig({
                vite: {
                    plugins: [
                        RELOAD_WINDOW_PLUGIN,
                        formIdTransform(root)
                    ]
                }
            });
        }
    }
};
