import { BigFileUploadOptions } from './components/form/UploadBigFile/uploadBigFileClient.js';
import { LoadUploadFilesOptions } from './components/form/UploadBigFile/uploadBigFileServer.js';
import type {CSRFSettings} from './form-tools/csrf.js';
import {AstroLinkHTTP} from './utils.js';

export type FormsSettings = {
    csrf?: CSRFSettings
    forms?: {
        viewStateFormFiled?: string
        bigFilesUpload?: {
            bigFileClientOptions?: Partial<BigFileUploadOptions>;
            bigFileServerOptions?:  Partial<LoadUploadFilesOptions>;
        }
    }
    session?: {
        cookieName?: string
        cookieOptions?: {
            httpOnly?: boolean
            sameSite?: boolean | 'lax' | 'strict' | 'none'
            maxAge?: number
            path?: string 
            secure?: boolean
        }
    },
    secret?: string,
    logs?: (type: 'warn' | 'error' | 'log', message: string) => void
}

export const FORM_OPTIONS: FormsSettings = {} as any;

export function getFormOptions(Astro: AstroLinkHTTP) {
    return Astro.locals?.__formsInternalUtils?.FORM_OPTIONS ?? FORM_OPTIONS;
}
