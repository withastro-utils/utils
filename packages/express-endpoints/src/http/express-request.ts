import ExpressResponse from './express-response.js';
import { APIContext, Props } from 'astro';
import { parseCookie } from 'cookie';
import mime from 'mime';
import ExpressBodyError from './http-errors/express-body-error.js';
import type { ExpressRouteBodyType } from '../express-route.js';
import { ExpressRouteBodyOptions } from '../express-route.js';
import { Accepts } from '@tinyhttp/accepts';


const BODY_REQUEST_TYPES_MAP = {
    json: 'application/json',
    multipart: 'multipart/form-data',
    urlencoded: 'application/x-www-form-urlencoded',
    text: 'text/plain'
} as const;

const BODY_METHODS = ['POST', 'PUT', 'PATCH'] as const;

type StringMap = { [key: string]: string };
export default class ExpressRequest {
    private _accepts!: Accepts;

    /**
     * @internal
     */
    public _response: ExpressResponse;

    public query: StringMap = {};
    public cookies: Record<string, string | Record<string, any>> = {};
    public session: StringMap = {};
    public body: any = {};
    public headers: StringMap = {};
    public params: StringMap = {};
    public filesOne: {
        [key: string]: File
    } = {};
    public filesMany: {
        [key: string]: File[]
    } = {};
    public method: string = '';
    public url: string = '';
    public originalUrl: string = '';
    public path: string = '';
    public subdomains: string[] = [];
    public hostname: string = '';
    public ip: string = '';
    public locals: APIContext['locals'] = {};
    public error?: Error;


    constructor(public astroContext: APIContext<Props>, private _bodyOptions: ExpressRouteBodyOptions) {
        this._response = new ExpressResponse(astroContext);
    }

    /**
     * @internal
     */
    public async _parse() {
        this.query = Object.fromEntries(this.astroContext.url.searchParams.entries());
        this.headers = Object.fromEntries([...this.astroContext.request.headers].map(([key, value]) => [key.toLowerCase(), value]));
        this.method = this.astroContext.request.method;
        this.url = this.astroContext.url.href;
        this.originalUrl = this.astroContext.url.pathname + this.astroContext.url.search;
        this.path = this.astroContext.url.pathname;
        this.cookies = ExpressRequest._parseCookies(this.headers.cookie);
        this.locals = this.astroContext.locals;
        this.session = (this.astroContext.locals as any).session;
        this.params = Object.fromEntries(Object.entries(this.astroContext.params).filter((entry): entry is [string, string] => entry[1] !== undefined));
        this.subdomains = this.astroContext.url.hostname.split('.').slice(0, -2);
        this.hostname = this.astroContext.url.hostname;
        this.ip = this.astroContext.clientAddress;
        this._accepts = new Accepts(this);

        if (this._bodyOptions.type && BODY_METHODS.includes(this.method as any)) {
            await this._parseBody(this._bodyOptions.type);
        }
    }

    /**
     * @internal
     */
    private async _parseBody(type: ExpressRouteBodyType) {
        if (!BODY_METHODS.includes(this.method as any)) {
            throw new ExpressBodyError(`Body parsing only available for ${ BODY_METHODS.join(', ') }`, 500);
        }

        if (this.astroContext.request.bodyUsed) {
            throw new ExpressBodyError('Request body already used', 500);
        }

        if (type === 'auto') {
            const contentType = this.get('content-type')?.split(';').shift()?.trim();
            if (!contentType) {
                return this.body;
            }
            type = Object.entries(BODY_REQUEST_TYPES_MAP).find(([, value]) => value === contentType)?.[0] as ExpressRouteBodyType ?? contentType as any;
        }

        switch (type) {
            case 'json':
                this.body = await this.astroContext.request.json();
                break;
            case 'multipart':
                await this._parseBodyMultiPart();
                break;
            case 'urlencoded':
                this.body = await this.astroContext.request.formData();
                break;
            case 'text':
                this.body = await this.astroContext.request.text();
                break;
            case 'raw':
                this.body = await this.astroContext.request.arrayBuffer();
                break;
            case 'none':
                break;
            default:
                throw new ExpressBodyError(`Unknown body type ${ type }`);
        }

        return this.body;
    }

    /**
     * @internal
     */
    private async _parseBodyMultiPart() {
        try {
            const formData = await this.astroContext.request.formData();

            for (const [key, value] of formData) {
                if (typeof value === 'string') {
                    if (this.body[key]) {
                        if (!Array.isArray(this.body[key])) {
                            this.body[key] = [this.body[key]];
                        }

                        this.body[key].push(value);
                    } else {
                        this.body[key] = value;
                    }
                    continue;
                }

                this.filesOne[key] = value;
                this.filesMany[key] ??= [];
                this.filesMany[key].push(value);
            }
        } catch (error) {
            this.error = error instanceof Error ? error : new Error(String(error));
        }

    }

    /**
     * Returns the value of a request header, using a case-insensitive header name.
     *
     * @example
     * request.get('content-type');
     */
    public get(headerName: string): string | undefined {
        return this.headers[headerName.toLowerCase()];
    }

    /**
     * Checks whether the request Content-Type matches the supplied MIME type or shorthand.
     *
     * @example
     * request.is('json');
     */
    public is(type: string) {
        type = BODY_REQUEST_TYPES_MAP[type] ?? type;
        const contentType = this.get('content-type')?.split(';').shift()?.trim();
        return contentType === mime.getType(type);
    }

    /**
     * Returns the best content type accepted by the client, or false when none match.
     *
     * @example
     * request.accepts(['json', 'html']);
     */
    public accepts(types: string | string[], ...args: string[]) {
        return this._accepts.types(types, ...args);
    }

    /**
     * Returns the best character set accepted by the client, or false when none match.
     *
     * @example
     * request.acceptsCharsets(['utf-8', 'iso-8859-1']);
     */
    public acceptsCharsets(types: string | string[], ...args: string[]) {
        return this._accepts.charsets(types, ...args);
    }

    /**
     * Returns the best content encoding accepted by the client, or false when none match.
     *
     * @example
     * request.acceptsEncodings(['gzip', 'identity']);
     */
    public acceptsEncodings(types: string | string[], ...args: string[]) {
        return this._accepts.encodings(types, ...args);
    }

    /**
     * Returns the best language accepted by the client, or false when none match.
     *
     * @example
     * request.acceptsLanguages(['en', 'fr']);
     */
    public acceptsLanguages(types: string | string[], ...args: string[]) {
        return this._accepts.languages(types, ...args);
    }

    /**
     * Returns a named route parameter, body field, or query parameter, in that order.
     * Returns the optional default value when the name is absent from all three sources.
     *
     * @example
     * request.param('userId', 'anonymous');
     */
    public param(name: string, defaultValue?: any) {
        return this.params[name] ?? this.body[name] ?? this.query[name] ?? defaultValue;
    }

    /**
     * Returns a request header value, or the optional default value when it is absent.
     * This is the default-value variant of `get()`.
     *
     * @example
     * request.header('x-request-id', 'unknown');
     */
    public header(name: string, defaultValue?: any) {
        return this.get(name) ?? defaultValue;
    }

    private static _parseCookies(cookie = '') {
        return Object.fromEntries(Object.entries(parseCookie(cookie)).filter(([, value]) => value != null).map(([key, value]) => {
            if (value?.startsWith('j:')) {
                try {
                    value = JSON.parse(value.slice(2));
                } catch { }
            }
            return [key, value];
        })) as Record<string, string | Record<string, any>>;
    }
}
