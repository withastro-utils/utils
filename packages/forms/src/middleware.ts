import {APIContext, MiddlewareEndpointHandler, MiddlewareNextResponse} from 'astro';
import {validateFrom} from './form-tools/csrf.js';
import {JWTSession} from './jwt-session.js';
import {FORM_OPTIONS, FormsSettings} from './settings.js';
import {v4 as uuid} from 'uuid';
import defaults from 'defaults';

const DEFAULT_FORM_OPTIONS: FormsSettings = {
    csrf: {
        formFiled: 'request-validation-token',
        sessionFiled: 'request-validation-secret'
    },
    forms: {
        allowEmptyFiles: true,
        minFileSize: 0,
        multiples: true
    },
    session: {
        cookieName: 'session',
        cookieOptions: {
            httpOnly: true,
            sameSite: true,
            maxAge: 1000 * 60 * 60 * 24 * 7
        }
    },
    secret: uuid()
};

export default function astroForms(settings: Partial<FormsSettings> = {}){
    Object.assign(FORM_OPTIONS, defaults(settings, DEFAULT_FORM_OPTIONS));

    return async function onRequest ({ locals, request, cookies }: APIContext , next: MiddlewareNextResponse) {
        const session = new JWTSession(cookies);
        locals.session = session.sessionData;

        await validateFrom({cookies, locals, request}, FORM_OPTIONS.csrf); 
        const response = await next();
        session.setCookieHeader(response.headers);

        return response;
    } as MiddlewareEndpointHandler;
}
