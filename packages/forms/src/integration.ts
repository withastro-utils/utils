export default {
    name: '@astro-metro/forms',
    hooks: {
        'astro:config:setup'({config, command}) {
            if(!command) return;
            config.vite ??= {};
            config.vite.plugins ??= [];

            config.vite.plugins.push({
                name: 'astro-metro-dev',
                apply: 'serve',
                enforce: 'post',
                transform(code, id) {
                    if (id.endsWith('node_modules/vite/dist/client/client.mjs')) {
                        return code.replaceAll(/\blocation\.reload\(\)(([\s;])|\b)/g, "window.open(location.href, '_self')$1")
                    }
                }
            });
        }
    }
};