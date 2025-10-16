import {APIContext, Props, ValidRedirectStatus} from 'astro';
import mime from 'mime';
import statuses from 'statuses';
import * as fs from 'fs/promises';
import * as path from 'path';
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

export default class ExpressResponse extends Headers {
    private _responseClosed = false;
    public responseBody: BodyInit | string | null | Buffer | Uint8Array = null;
    public statusCode: number = 200;

    public constructor(public astroContext: APIContext<Props>) {
        super();
    }

    /**
     * Set a cookie
     */
    public cookie(key: string, value: string | Record<string, any>, options?: ExpressResponseCookieSetOptions) {
        this.astroContext.cookies.set(key, value, options);
        return this;
    }

    public clearCookie(key: string, options?: ExpressResponseCookieDeleteOptions) {
        this.astroContext.cookies.delete(key, options);
        return this;
    }

    /**
     * Set the content type
     */
    public type(type: string) {
        type = mime.getType(type) || type;
        this.set('Content-Type', `${type}; charset=utf-8`);
        return this;
    }

    /**
     * Set the status code
     */
    public status(status: number) {
        this.statusCode = status;
        return this;
    }

    /**
     * Send a json response
     */
    public json(body: any) {
        this.responseBody = JSON.stringify(body);
        this.type('json');
        return this;
    }

    /**
     * Send an html response
     */
    public html(body: string) {
        this.responseBody = body;
        this.type('html');
        return this;
    }

    /**
     * Send a body response
     */
    public send(body: string | Buffer | Uint8Array | any) {
        if (this._responseClosed) {
            throw new ExpressError('Response already closed');
        }

        if (body instanceof Buffer || body instanceof Uint8Array) {
            this.responseBody = body;
        } else if (typeof body === 'object' && body !== undefined) {
            return this.json(body);
        }

        this.responseBody = body;
        return this;
    }

    /**
     * End the response
     */
    public end(body: string | Buffer | Uint8Array | any) {
        this.send(body);
        this._responseClosed = true;
        return this;
    }

    /**
     * Sets the response HTTP status code to statusCode and sends the registered status message as the text response body
     */
    public sendStatus(status: number) {
        this.status(status);
        this.responseBody = statuses(status) || status.toString();
        return this;
    }

    /**
     * Redirect to a url
     */
    public redirect(url: string, status: ValidRedirectStatus = 302) {
        this.set('Location', url);
        this.status(status);
        return this;
    }

    /**
     * Send a file
     */
    public async sendFile(filePath: string) {
        const content = await fs.readFile(filePath);
        this.responseBody = content;
        this.type(filePath);
        return this;
    }

    /**
     * Send a file as an attachment
     */
    public async attachment(filePath: string, fileName = path.parse(filePath).name) {
        await this.sendFile(filePath);
        this.set('Content-Disposition', `attachment; filename="${fileName}"`);
        return this;
    }

    /**
     * Set the cache control header
     */
    public cacheControl({days = 0, months = 0, minuets = 0}: CacheControlOptions) {
        const totalSeconds = days * 24 * 60 * 60 + months * 30 * 24 * 60 * 60 + minuets * 60;
        this.set('Cache-Control', `max-age=${totalSeconds}`);
        return this;
    }

    /**
     * @internal
     */
    public _createResponseNativeObject() {
        return new Response(this.responseBody as any, {
            headers: this,
            status: this.statusCode
        });
    }
}
