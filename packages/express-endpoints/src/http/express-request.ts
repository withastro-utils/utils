import ExpressResponse from './express-response.js';
import {APIContext, Props} from 'astro';
import {parse as cookieParse} from 'cookie';
import mime from 'mime';
import ExpressBodyError from './http-errors/express-body-error.js';
import {EventEmitter} from 'events';
import type {ExpressRouteBodyType} from '../express-route.js';
import {ExpressRouteBodyOptions} from '../express-route.js';
import {Accepts} from '@tinyhttp/accepts';

interface ExpressRequestEventEmitterTypes {
    on(event: 'close', listener: (error?: Error) => void): this;

    emit(event: 'close', error?: Error): boolean;
}

const BODY_REQUEST_TYPES_MAP = {
    json: 'application/json',
    multipart: 'multipart/form-data',
    urlencoded: 'application/x-www-form-urlencoded',
    text: 'text/plain'
} as const;

const BODY_METHODS = ['POST', 'PUT', 'PATCH'] as const;

type StringMap = { [key: string]: string };
export default class ExpressRequest extends EventEmitter implements ExpressRequestEventEmitterTypes {
    private _accepts: Accepts;

    /**
     * @internal
     */
    public _response: ExpressResponse;

    public query: StringMap = {};
    public cookies: StringMap = {};
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
    public path: string = '';
    public subdomains: string[] = [];
    public hostname: string = '';
    public ip: string = '';
    public locals: APIContext['locals'] = {};
    public error?: Error;


    constructor(public astroContext: APIContext<Props>, private _bodyOptions: ExpressRouteBodyOptions) {
        super();
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
        this.path = this.astroContext.url.pathname;
        this.cookies = cookieParse(this.headers.cookie ?? '');
        this.locals = this.astroContext.locals;
        this.session = this.astroContext.locals.session;
        this.params = this.astroContext.params;
        this.subdomains = this.astroContext.url.hostname.split('.').slice(0, -2);
        this.hostname = this.astroContext.url.hostname;
        this.ip = this.astroContext.clientAddress;
        this._accepts = new Accepts(this);

        if (this._bodyOptions.type && BODY_METHODS.includes(this.method as any)) {
            await this.parseBody(this._bodyOptions.type);
        }
    }

    async parseBody(type: ExpressRouteBodyType) {
        if (!BODY_METHODS.includes(this.method as any)) {
            throw new ExpressBodyError(`Body parsing only available for ${BODY_METHODS.join(', ')}`, 500);
        }

        if (this.astroContext.request.bodyUsed) {
            throw new ExpressBodyError('Request body already used', 500);
        }

        if (type === 'auto') {
            const contentType = this.get('content-type').split(';').shift().trim();
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
            default:
                throw new ExpressBodyError(`Unknown body type ${type}`);
        }

        return this.body;
    }

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
            this.error = error;
        }

    }

    /**
     * Get the response header
     */
    public get(headerName: string): string | undefined {
        return this.headers[headerName.toLowerCase()];
    }

    /**
     * Check header content type
     * @example
     * request.is('json');
     */
    public is(type: string) {
        type = BODY_REQUEST_TYPES_MAP[type] ?? type;
        const contentType = this.get('content-type').split(';').shift().trim();
        return contentType === mime.getType(type);
    }

    public accepts(types: string | string[], ...args: string[]) {
        return this._accepts.types(types, ...args);
    }

    public acceptsCharsets(types: string | string[], ...args: string[]) {
        return this._accepts.charsets(types, ...args);
    }

    public acceptsEncodings(types: string | string[], ...args: string[]) {
        return this._accepts.encodings(types, ...args);
    }

    public acceptsLanguages(types: string | string[], ...args: string[]) {
        return this._accepts.languages(types, ...args);
    }

    public param(name: string, defaultValue?: any) {
        return this.params[name] ?? this.body[name] ?? this.query[name] ?? defaultValue;
    }

    public header(name: string, defaultValue?: any) {
        return this.get(name) ?? defaultValue;
    }
}
