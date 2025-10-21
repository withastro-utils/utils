import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';

const dirname = path.dirname(fileURLToPath(import.meta.url));
const renderTemplatePath = path.resolve(dirname, './integration/render/render-template.js');
const anyPath = path.resolve(dirname, './integration/render/any.js');

const ALIASES = {
    'node_modules/astro/dist/runtime/server/render/astro/render-template.js': renderTemplatePath,
    'node_modules/astro/dist/runtime/server/render/any.js': anyPath,
};

export default {
    name: '@astro-utils/forms',
    hooks: {
        'astro:config:setup'({ updateConfig }) {
            updateConfig({
                vite: {
                    plugins: [
                        {
                            name: 'astro-utils-dev',
                            async transform(code: string, id: string) {
                                if (id.endsWith('node_modules/vite/dist/client/client.mjs')) {
                                    return code.replace(/\blocation\.reload\(\)(([\s;])|\b)/g, "window.open(location.href, '_self')$1");
                                }
                            }
                        },
                        {
                            name: 'astro-utils-render-replacer',
                            enforce: 'pre',
                            async load(id: string) {
                                for (const [find, replace] of Object.entries(ALIASES)) {
                                    if (id.endsWith(find)) {
                                        return await fs.readFile(replace, 'utf-8');
                                    }
                                }
                                return null;
                            }
                        }
                    ]
                }
            });
        }
    }
};
