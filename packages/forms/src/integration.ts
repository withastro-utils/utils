export default {
    name: 'astro-site-session',
    hooks: {
        'astro:config:setup': ({ injectScript }) => {
            injectScript('page-ssr', `
            const {initialize} = await import("@astro-metro/forms/dist/settings.js");
            try {
                const {default: webFormSettings} = await import("../forms.config.ts");
                initialize(webFormSettings);
            } catch(err) {
                initialize();
            }
            `);
        },
    }
};