import {Options} from 'formidable';
import ExpressRequest from './http/express-request.js';
import ExpressResponse from './http/express-response.js';
import {APIRoute} from 'astro';
import {RequestValidation, validateRequest} from 'zod-express-middleware';
import {RequestHandlerParams} from 'express-serve-static-core';

export type ExpressRouteBodyType = 'json' | 'multipart' | 'urlencoded' | 'text' | 'auto';
export type ExpressRouteCallback = (req: ExpressRequest, res: ExpressResponse, next?: () => any) => any;
export type ExpressRouteBodyOptions = {
    type?: ExpressRouteBodyType,
    options?: Options,
    default?: boolean
};

export default class ExpressRoute {
    private _middleware: ExpressRouteCallback[] = [];
    private _lastValidation: ExpressRouteCallback[] = [];
    private _bodyOptions: ExpressRouteBodyOptions = {type: 'auto', default: true};

    public constructor() {
    }

    use(middleware: ExpressRouteCallback | RequestHandlerParams | ExpressRoute) {
        if (middleware instanceof ExpressRoute) {
            this._middleware = this._middleware.concat(middleware._middleware);
            if (!middleware._bodyOptions.default) {
                this._bodyOptions = middleware._bodyOptions;
            }
            return this;
        }
        this._middleware.push(middleware as any);
        return this;
    }

    body(type: ExpressRouteBodyType | null, options?: Options) {
        this._bodyOptions = {type, options};
        return this;
    }

    /**
     * Add validation middleware
     *
     * Check out [zod-express-middleware](https://www.npmjs.com/package/zod-express-middleware)
     */
    validate<TParams = any, TQuery = any, TBody = any>(schemas: RequestValidation<TParams, TQuery, TBody>) {
        this._lastValidation.push(validateRequest(schemas) as any);
        return this;
    }

    route(...middlewares: ExpressRouteCallback[]): APIRoute {
        const bodyOptions = this._bodyOptions;
        const validation = this._lastValidation.pop();
        if (validation) {
            middlewares.unshift(validation);
        }
        return async (context) => {
            try {
                const request = new ExpressRequest(context, bodyOptions);
                await request._parse();

                await this._runMiddleware(request, middlewares);
                request.emit('close');
                request.emit('finish');
                return request._response._createResponseNativeObject();
            } catch (error: any) {
                return new Response(error.message, {status: error.status ?? 500});
            }
        };
    }

    private async _runMiddleware(req: ExpressRequest, extraMiddleware: ExpressRouteCallback[] = []) {
        for (const middleware of this._middleware.concat(extraMiddleware)) {
            let runNext = false;
            let okToRunNext = () => runNext = true;
            await middleware(req, req._response, okToRunNext);

            if (!runNext) {
                break;
            }
        }
    }
}
