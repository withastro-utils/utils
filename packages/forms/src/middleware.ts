import type {APIContext, MiddlewareHandler, MiddlewareNext} from 'astro';
import {DEFAULT_SETTINGS as DEFAULT_SETTINGS_CSRF, ensureValidationSecret} from './form-tools/csrf.js';
import {JWTSession} from './jwt-session.js';
import {FORM_OPTIONS, type FormsSettings} from './settings.js';
import {v4 as uuid} from 'uuid';
import deepmerge from 'deepmerge';
import {timeout} from 'promise-timeout';
import FormsReact from './form-tools/forms-react.js';

const DEFAULT_FORM_OPTIONS: FormsSettings = {
    csrf: DEFAULT_SETTINGS_CSRF,
    forms: {
        viewStateFormFiled: '__view-state',
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
    secret: uuid(),
    logs: (type, message) => {
        console[type](message);
    },
};

export default function astroForms(settings: Partial<FormsSettings> = {}) {
    Object.assign(FORM_OPTIONS, deepmerge(settings, DEFAULT_FORM_OPTIONS));

    return async function onRequest({locals, request, cookies}: APIContext, next: MiddlewareNext) {
        const likeAstro = {locals, request, cookies};
        const session = new JWTSession(cookies);
        locals.session = session.sessionData;
        locals.forms = new FormsReact(likeAstro);

        let response: Response;
        let pageFinished: (data?: any) => void;

        locals.__formsInternalUtils = {
            onWebFormClose() {
                session.setCookieHeader(response.headers);
                pageFinished();
            },
            FORM_OPTIONS: FORM_OPTIONS
        };

        await ensureValidationSecret(likeAstro);
        response = await next();

        if (!locals.webFormOff) {
            try {
                const pageFinishedPromise = new Promise(resolve => pageFinished = resolve);
                await timeout(pageFinishedPromise, FORM_OPTIONS.pageLoadTimeoutMS);
            } catch {
                FORM_OPTIONS.logs?.('warn', 'WebForms page load timeout (are you sure you are using WebForms?)');
            }
        }

        return response;
    } as MiddlewareHandler;
}
