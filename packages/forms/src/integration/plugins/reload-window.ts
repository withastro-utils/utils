export const RELOAD_WINDOW_PLUGIN = {
    name: 'astro-utils-dev',
    async transform(code: string, id: string) {
        if (id.endsWith('node_modules/vite/dist/client/client.mjs')) {
            return code.replace(/\blocation\.reload\(\)(([\s;])|\b)/g, "window.open(location.href, '_self')$1");
        }
    }
};