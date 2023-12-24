import type {CSRFSettings} from './form-tools/csrf.js';
import {AstroLinkHTTP} from './utils.js';

export type FormsSettings = {
    csrf?: CSRFSettings
    forms?: {
        viewStateFormFiled: string
    }
    session?: {
        cookieName: string
        cookieOptions: {
            httpOnly: boolean
            sameSite: boolean | 'lax' | 'strict' | 'none'
            maxAge: number
        }
    },
    secret?: string,
    pageLoadTimeoutMS?: number
    logs?: (type: 'warn' | 'error' | 'log', message: string) => void
}

export const FORM_OPTIONS: FormsSettings = {} as any;

export function getFormOptions(Astro: AstroLinkHTTP) {
    return Astro.locals?.__formsInternalUtils?.FORM_OPTIONS ?? FORM_OPTIONS;
}
