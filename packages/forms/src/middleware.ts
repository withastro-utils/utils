import type {APIContext, MiddlewareHandler, MiddlewareNext} from 'astro';
import {DEFAULT_SETTINGS as DEFAULT_SETTINGS_CSRF, ensureValidationSecret} from './form-tools/csrf.js';
import {JWTSession} from './jwt-session.js';
import {FORM_OPTIONS, type FormsSettings} from './settings.js';
import {v4 as uuid} from 'uuid';
import deepmerge from 'deepmerge';
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

        locals.__formsInternalUtils = {
            FORM_OPTIONS: FORM_OPTIONS
        };

        await ensureValidationSecret(likeAstro);
        const response = await next();

        const isHTML = response.headers.get('Content-Type')?.includes('text/html');
        if (locals.webFormOff || !isHTML) {
            return response;
        }

        const content = await response.text();
        const newResponse = locals.forms.overrideResponse || new Response(content, response);
        session.setCookieHeader(newResponse.headers);

        return newResponse;
    } as MiddlewareHandler;
}
