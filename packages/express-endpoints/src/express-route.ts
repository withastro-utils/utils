import ExpressRequest from './http/express-request.js';
import ExpressResponse from './http/express-response.js';
import { APIRoute } from 'astro';
import validate, { setGlobalOptions, type CompleteValidationSchema, type ValidationSchema } from 'express-zod-safe';
import { RequestHandlerParams } from 'express-serve-static-core';

export type ExpressRouteBodyType = 'json' | 'multipart' | 'urlencoded' | 'text' | 'auto' | 'raw' | 'none';
export type ExpressRouteCallback = (req: ExpressRequest, res: ExpressResponse, next?: (error?: unknown) => void) => any;
export type ExpressRouteBodyOptions = {
    type?: ExpressRouteBodyType,
    default?: boolean
};

setGlobalOptions({
    defaultSchemaObject: 'lax',
    missingSchemaBehavior: 'any'
});

export default class ExpressRoute {
    private _middleware: ExpressRouteCallback[] = [];
    private _lastValidation: ExpressRouteCallback[] = [];
    private _bodyOptions: ExpressRouteBodyOptions = { type: 'auto', default: true };

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

    body(type: ExpressRouteBodyType) {
        this._bodyOptions = { type };
        return this;
    }

    /**
     * Add validation middleware
     *
     * Check out [express-zod-safe](https://www.npmjs.com/package/express-zod-safe), globals sets to: 
     *  - defaultSchemaObject: lax
     *  - missingSchemaBehavior: any
     */
    validate<TParams extends ValidationSchema, TQuery extends ValidationSchema, TBody extends ValidationSchema>(schemas: CompleteValidationSchema<TParams, TQuery, TBody>) {
        this._lastValidation.push(validate(schemas) as any);
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

                void this._runMiddleware(request, middlewares);
                return await request._response._createResponseNativeObject();
            } catch (error: any) {
                return new Response(error.message, { status: error.status ?? 500 });
            }
        };
    }

    private async _runMiddleware(req: ExpressRequest, extraMiddleware: ExpressRouteCallback[] = []) {
        const res = req._response;
        const { promise: closed, resolve: close } = Promise.withResolvers<boolean>();
        const onClose = () => close(false);
        res.once('close', onClose);

        try {
            for (const middleware of this._middleware.concat(extraMiddleware)) {
                if (res.writableEnded || res.destroyed) break;

                const { promise, resolve } = Promise.withResolvers<boolean>();
                const fail = (error: unknown) => {
                    console.error(error);
                    resolve(false);
                };

                Promise.resolve().then(() =>
                    middleware(req, res, error => error ? fail(error) : resolve(true))
                ).catch(fail);

                if (!await Promise.race([promise, closed])) break;
            }
        } finally {
            res.off('close', onClose);
        }
    }
}
