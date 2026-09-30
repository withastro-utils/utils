import { APIContext, Props, ValidRedirectStatus } from 'astro';
import { stringifySetCookie } from 'cookie';
import * as oldFs from 'fs';
import mime from 'mime';
import { PassThrough, Readable } from 'node:stream';
import * as path from 'path';
import statuses from 'statuses';
import ExpressError from './http-errors/express-error.js';

type ExpressResponseCookieDeleteOptions = {
    domain?: string;
    path?: string;
}

type ExpressResponseCookieSetOptions = {
    expires?: Date;
    httpOnly?: boolean;
    maxAge?: number;
    sameSite?: boolean | 'lax' | 'none' | 'strict';
    secure?: boolean;
} & ExpressResponseCookieDeleteOptions;

type CacheControlOptions = {
    minuets?: number;
    days?: number;
    months?: number;
}

type HeaderValue = string | string[] | number;
type HeaderInput = Record<string, HeaderValue>;

const LIKE_BUFFER = [ArrayBuffer, Buffer, Uint8Array];

export default class ExpressResponse extends PassThrough {
    private _headers = new Map<string, string[]>();
    private _responseStarted = Promise.withResolvers<void>();
    private _headersSend = false;
    private readonly _responseBody: ReadableStream<Uint8Array>;

    public statusCode: number = 200;

    public constructor(public astroContext: APIContext<Props>) {
        super();
        this._responseBody = Readable.toWeb(this) as ReadableStream<Uint8Array>;
    }

    /**
     * Sets a `Set-Cookie` response header.
     * Object values are JSON-encoded and `options.maxAge` is specified in milliseconds, matching Express.
     */
    public cookie(key: string, value: string | Record<string, any>, options: ExpressResponseCookieSetOptions = {}) {
        if (!(typeof value === 'string')) {
            value = 'j:' + JSON.stringify(value);
        }

        let maxAge: number | undefined;
        if (options.maxAge) { // max age is in milliseconds in express
            maxAge = options.maxAge / 1000;
        }

        this.append('Set-Cookie', stringifySetCookie({ name: key, value, ...options, maxAge }));
        return this;
    }

    /**
     * Clears a cookie by appending an expired `Set-Cookie` response header.
     * Pass the same `path` and `domain` used when the cookie was created.
     */
    public clearCookie(key: string, options: ExpressResponseCookieDeleteOptions = {}) {
        this.append('Set-Cookie', stringifySetCookie({ name: key, value: '', expires: new Date(0), ...options }));
        return this;
    }

    /** Whether the status and headers have already been sent by `write()`, `writeHead()`, or `end()`. */
    public get headersSent() {
        return this._headersSend;
    }

    /**
     * Sets one or more response headers, replacing any existing values for each header.
     * Accepts either a header name and value or an object containing multiple headers.
     */
    public set(name: string, value: HeaderValue): this;
    public set(headers: HeaderInput): this;
    public set(nameOrHeaders: string | HeaderInput, value?: HeaderValue) {
        this._assertHeadersNotSent();

        const headers = typeof nameOrHeaders === 'string' ? { [nameOrHeaders]: value as HeaderValue } : nameOrHeaders;
        for (const [name, headerValue] of Object.entries(headers)) {
            this._headers.set(name.toLowerCase(), [headerValue].flat().map(String));
        }
        return this;
    }

    /** Alias for `set()`, provided for Express compatibility. */
    public header(name: string, value: HeaderValue): this;
    public header(headers: HeaderInput): this;
    public header(nameOrHeaders: string | HeaderInput, value?: HeaderValue) {
        return this.set(nameOrHeaders as string, value as HeaderValue);
    }

    /** Returns a response header as a comma-separated string, or `undefined` when it is not set. */
    public get(name: string) {
        return this.getHeader(name)?.join(', ');
    }

    /** Node-compatible alias for `set()`. Replaces all existing values for the header. */
    public setHeader(name: string, value: HeaderValue) {
        return this.set(name, value);
    }

    /** Returns all values for a response header, or `undefined` when it is not set. */
    public getHeader(name: string) {
        return this._headers.get(name.toLowerCase());
    }

    /** Returns the current response headers as an object of lowercase names and string arrays. */
    public getHeaders() {
        return Object.fromEntries(this._headers);
    }

    /** Returns the lowercase names of all current response headers. */
    public getHeaderNames() {
        return [...this._headers.keys()];
    }

    /** Returns whether a response header has been set. Header names are case-insensitive. */
    public hasHeader(name: string) {
        return this._headers.has(name.toLowerCase());
    }

    /** Removes a response header before the headers have been sent. */
    public removeHeader(name: string) {
        this._assertHeadersNotSent();

        this._headers.delete(name.toLowerCase());
    }

    /** Appends one or more values to a response header without replacing its existing values. */
    public append(name: string, value: HeaderValue) {
        this._assertHeadersNotSent();

        const normalizedName = name.toLowerCase();
        const values = this._headers.get(normalizedName) ?? [];
        values.push(...[value].flat().map(String));
        this._headers.set(normalizedName, values);
        return this;
    }

    /** Node-compatible alias for `append()`. */
    public appendHeader(name: string, value: HeaderValue) {
        return this.append(name, value);
    }

    /** Sets the status and optional headers, then marks the response headers as sent. */
    public writeHead(statusCode: number, headers: HeaderInput = {}) {
        this.status(statusCode);
        this.set(headers);
        this._startResponse();
        return this;
    }

    /**
     * Writes a chunk to the response stream and sends the status and headers on the first write.
     * Supports the standard Node.js writable stream encoding and callback overloads.
     */
    public write(chunk: any, callback?: (error: Error | null | undefined) => void): boolean;
    public write(chunk: any, encoding: BufferEncoding, callback?: (error: Error | null | undefined) => void): boolean;
    public write(chunk: any, encodingOrCallback?: BufferEncoding | ((error: Error | null | undefined) => void), callback?: (error: Error | null | undefined) => void): boolean {
        this._startResponse();
        return super.write(chunk, encodingOrCallback as BufferEncoding, callback);
    }


    /**
     * Set the content type
     */
    public type(type: string) {
        type = mime.getType(type) || type;
        this.set('Content-Type', `${ type }; charset=utf-8`);
        return this;
    }

    /**
     * Set the status code
     */
    public status(status: number) {
        this._assertHeadersNotSent();

        this.statusCode = status;
        return this;
    }

    /**
     * Send a json response
     */
    public json(body: any) {
        this.type('json');
        this.end(JSON.stringify(body));
        return this;
    }

    /**
     * Send an html response
     */
    public html(body: string) {
        this.type('html');
        this.send(body);
        return this;
    }

    /**
     * Send a body response
     */
    public send(body: string | Buffer | Uint8Array | ArrayBuffer | any) {
        if (this.writableEnded) {
            throw new ExpressError('Response already ended');
        }

        if (body != null && typeof body === 'object' && !LIKE_BUFFER.some(x => body instanceof x)) {
            return this.json(body);
        }

        this.end(body);
        return this;
    }

    /**
     * Ends the response stream, optionally writing a final body chunk.
     * Supports the standard Node.js writable stream encoding and callback overloads.
     */
    public end(callback?: () => void): this;
    public end(body: any, callback?: () => void): this;
    public end(body: any, encoding: BufferEncoding, callback?: () => void): this;
    public end(bodyOrCallback?: any, encodingOrCallback?: BufferEncoding | (() => void), callback?: () => void): this {
        if (this.writableEnded) {
            throw new ExpressError('Response already ended');
        }

        if(bodyOrCallback instanceof ArrayBuffer){
            bodyOrCallback = Buffer.from(bodyOrCallback);
        }

        this._startResponse();
        super.end(bodyOrCallback, encodingOrCallback as BufferEncoding, callback);
        return this;
    }

    /**
     * Sets the response HTTP status code to statusCode and sends the registered status message as the text response body
     */
    public sendStatus(status: number) {
        this.status(status);
        this.send(statuses(status) || status.toString());
        return this;
    }

    /**
     * Redirect to a url
     */
    public redirect(url: string, status: ValidRedirectStatus = 302) {
        this.set('Location', url);
        this.status(status);
        this.end();
        return this;
    }

    /**
     * Send a file
     */
    public sendFile(filePath: string) {
        const content = oldFs.createReadStream(filePath);
        this.type(filePath);
        content.once('error', error => {
            this._responseStarted.reject(error);
            this.destroy();
        });
        content.pipe(this);
        return this;
    }

    /**
     * Send a file as an attachment
     */
    public attachment(filePath: string, fileName = path.parse(filePath).name) {
        this.set('Content-Disposition', `attachment; filename="${ fileName }"`);
        this.sendFile(filePath);
        return this;
    }

    /**
     * Set the cache control header
     */
    public cacheControl({ days = 0, months = 0, minuets = 0 }: CacheControlOptions) {
        const totalSeconds = days * 24 * 60 * 60 + months * 30 * 24 * 60 * 60 + minuets * 60;
        this.set('Cache-Control', `max-age=${ totalSeconds }`);
        return this;
    }

    /**
     * @internal
     */
    public async _createResponseNativeObject() {
        await this._responseStarted.promise;
        const headers = new Headers();
        for (const [name, value] of this._headers) {
            for (const item of value) {
                headers.append(name, String(item));
            }
        }
        return new Response(this._responseBody, {
            headers,
            status: this.statusCode
        });
    }

    private _assertHeadersNotSent() {
        if (this._headersSend) {
            throw new ExpressError('Headers already sent');
        }
    }

    private _startResponse() {
        if (!this._headersSend) {
            this._headersSend = true;
            this._responseStarted.resolve();
        }
    }
}
