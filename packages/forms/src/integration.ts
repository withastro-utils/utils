import { writeFile } from "fs/promises";
import { refactorCodeInlineRenderComponent } from "./integration/codeTransform.js";

export default {
    name: '@astro-utils/forms',
    hooks: {
        'astro:config:setup'({config, command}) {
            if(!command) return;
            config.vite ??= {};
            config.vite.plugins ??= [];

            config.vite.plugins.push({
                name: 'astro-utils-dev',
                async transform(code: string, id: string) {
                    if(code.includes('class RenderTemplateResult')){
                        code = refactorCodeInlineRenderComponent(code);
                        if(id.includes("/node_modules/astro/")){
                            await writeFile(id, code);
                        }
                    }

                    if (id.endsWith('node_modules/vite/dist/client/client.mjs')) {
                        return code.replace(/\blocation\.reload\(\)(([\s;])|\b)/g, "window.open(location.href, '_self')$1")
                    }

                    return code;
                }
            });
        }
    }
};
