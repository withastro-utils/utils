import type {ValidRedirectStatus} from 'astro';
import {AstroLinkHTTP} from 'src/utils.js';

export default class FormsReact {
    public scriptToRun = '';

    public constructor(private _astro: AstroLinkHTTP) {
    }

    /**
     * Redirects the user to the given URL after the given timeout. (using `setTimeout`)
     * @param url - URL to redirect to
     * @param timeoutSec - timeout in seconds
     */
    public redirectTimeoutSeconds(url: string, timeoutSec = 0) {
        this.scriptToRun += `
            setTimeout(function() {
                window.location.href = new URL("${this._escapeParentheses(url)}", window.location.href).href;
            }, ${timeoutSec * 1000});
        `.trim();
    }

    /**
     * Update the search parameters of the current URL and return `Response` object.
     */
    public updateSearchParams() {
        const url = new URL(this._astro.request.url, 'http://example.com');
        const search = url.searchParams;

        return {
            search,
            redirect(status?: ValidRedirectStatus) {
                const pathWithSearch = url.pathname.split('/').pop() + search.toString();
                return new Response(null, {
                    status: status || 302,
                    headers: {
                        Location: pathWithSearch,
                    },
                });
            }
        };
    }

    /**
     * Update **one** search parameter of the current URL and return `Response` object.
     * @param key - search parameter key
     * @param value - search parameter value (if `null` the parameter will be removed)
     * @param status - redirect status code
     */
    public updateOneSearchParam(key: string, value?: string, status?: ValidRedirectStatus) {
        const {search, redirect} = this.updateSearchParams();

        if (value == null) {
            search.delete(key);
        } else {
            search.set(key, value);
        }

        return redirect(status);
    }

    /**
     * Prompt alert message to the user with the `window.alert` function.
     * @param message
     */
    public alert(message: string) {
        this.callFunction('alert', message);
    }

    /**
     * Print a message to the client console with the `console` class.
     */
    public console(type: keyof Console, ...messages: any[]) {
        if (!(type in console)) {
            throw new Error(`Invalid console type: ${type}`);
        }

        this.callFunction(`console.${type}`, ...messages);
    }

    /**
     * Print a message to the client console with the `console.log` function.
     */
    public consoleLog = this.console.bind(this, 'log');

    /**
     * Call a client side function with the given arguments.
     * @warning - this is **not** a safe function, make sure to validate the arguments before calling this function.
     */
    public callFunction(func: string, ...args: any[]) {
        this.scriptToRun += `
            ${func}(...${JSON.stringify(args)});
        `.trim();
    }

    private _escapeParentheses(str: string) {
        return str.replace(/"/g, '\\"');
    }
}
