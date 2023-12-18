import {APIContext, MiddlewareHandler, MiddlewareNext} from 'astro';
import {DEFAULT_SETTINGS as DEFAULT_SETTINGS_CSRF, ensureValidationSecret} from './form-tools/csrf.js';
import {JWTSession} from './jwt-session.js';
import {FORM_OPTIONS, FormsSettings} from './settings.js';
import {v4 as uuid} from 'uuid';
import defaults from 'defaults';
import {timeout} from 'promise-timeout';

const DEFAULT_FORM_OPTIONS: FormsSettings = {
    csrf: DEFAULT_SETTINGS_CSRF,
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
    pageLoadTimeoutMS: 1000 * 5,
    secret: uuid()
};

export default function astroForms(settings: Partial<FormsSettings> = {}){
    Object.assign(FORM_OPTIONS, defaults(settings, DEFAULT_FORM_OPTIONS));

    return async function onRequest({locals, request, cookies}: APIContext, next: MiddlewareNext) {
        const session = new JWTSession(cookies);
        locals.session = session.sessionData;

        let response: Response;
        let pageFinished: (data?: any) => void;

        locals.__formsInternalUtils = {
            onWebFormClose() {
                session.setCookieHeader(response.headers);
                pageFinished();
            }
        };

        await ensureValidationSecret({locals, request, cookies});
        response = await next();

        if (!locals.webFormOff) {
            try {
                const pageFinishedPromise = new Promise(resolve => pageFinished = resolve);
                await timeout(pageFinishedPromise, FORM_OPTIONS.pageLoadTimeoutMS);
            } catch {
                console.warn('WebForms page load timeout (are you sure you are using WebForms?)');
            }
        }

        return response;
    } as MiddlewareHandler;
}
