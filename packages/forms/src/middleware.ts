import type { APIContext, MiddlewareHandler, MiddlewareNext } from 'astro';
import { DEFAULT_SETTINGS as DEFAULT_SETTINGS_CSRF, ensureValidationSecret } from './form-tools/csrf.js';
import { JWTSession } from './jwt-session.js';
import { FORM_OPTIONS, type FormsSettings } from './settings.js';
import { v4 as uuid } from 'uuid';
import objectAssignDeep from 'object-assign-deep';
import FormsReact from './form-tools/forms-react.js';
import ThrowOverrideResponse from './throw-action/throwOverrideResponse.js';
import { DEFAULT_BIG_FILE_UPLOAD_OPTIONS_SERVER } from './components/form/UploadBigFile/uploadBigFileServer.js';

const DEFAULT_FORM_OPTIONS: FormsSettings = {
    csrf: DEFAULT_SETTINGS_CSRF,
    forms: {
        viewStateFormFiled: '__view-state',
        bigFilesUpload: {
            bigFileServerOptions: DEFAULT_BIG_FILE_UPLOAD_OPTIONS_SERVER
        }
    },
    session: {
        cookieName: 'session',
        cookieOptions: {
            httpOnly: true,
            sameSite: "lax",
            maxAge: 1000 * 60 * 60 * 24 * 7,
            path: '/'
        }
    },
    secret: uuid(),
    logs: (type, message) => {
        console[type](message);
    },
};

export default function astroForms(settings: Partial<FormsSettings> = {}) {
    objectAssignDeep(FORM_OPTIONS, DEFAULT_FORM_OPTIONS, settings);

    return async function onRequest({ locals, request, cookies }: APIContext, next: MiddlewareNext) {
        const likeAstro = { locals, request, cookies };
        const session = new JWTSession(cookies);
        locals.session = session.sessionData;        
        const forms = locals.forms = new FormsReact(likeAstro);
        await ensureValidationSecret(likeAstro);

        locals.__formsInternalUtils = {
            FORM_OPTIONS: FORM_OPTIONS,
            bindFormCounter: 0,
            bindGlobalState: {},
            firstRender: true,
        };

        try {
            let reloadPage = true;
            let newResponse: Response | null = null;

            while (reloadPage) {
                const response = await next();
                const isHTML = response.headers.get('Content-Type')?.includes('text/html');
                if (locals.webFormOff || !isHTML) {
                    return response;
                }

                const content = await response.text();
                newResponse = forms.overrideResponse || new Response(content, response);
                reloadPage = forms._reloadState;
                locals.__formsInternalUtils.bindFormCounter = 0;
                locals.__formsInternalUtils.firstRender = false;
                forms._reloadState = false;
                forms._stopRendering = false;
            }

            if(!(newResponse instanceof Response)) {
                throw new Error('Astro.locals.forms.overrideResponse must be a Response instance');
            }

            session.setCookieHeader(newResponse.headers);

            return newResponse;
        } catch (error: any) {
            if (!(error instanceof ThrowOverrideResponse)) {
                throw error;
            }

            const newResponse = error.response ?? locals.forms.overrideResponse ?? new Response(error.message, { status: 500 });
            if(!(newResponse instanceof Response)) {
                throw new Error('ThrowOverrideResponse.response must be a Response instance');
            }

            session.setCookieHeader(newResponse.headers);
            return newResponse;
        }
    } as MiddlewareHandler;
}
