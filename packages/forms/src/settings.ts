import type { SerializeOptions } from 'cookie';
import { BigFileUploadOptions } from './components/form/UploadBigFile/uploadBigFileClient.js';
import { LoadUploadFilesOptions } from './components/form/UploadBigFile/uploadBigFileServer.js';
import type {CSRFSettings} from './form-tools/csrf.js';
import type {AstroGlobalLike} from './utils.js';

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
        cookieOptions?: SerializeOptions
    },
    secret?: string,
    logs?: (type: 'warn' | 'error' | 'log', message: string) => void
}

export const FORM_OPTIONS: FormsSettings = {} as any;

export function getFormOptions(Astro: AstroGlobalLike) {
    return Astro.locals?.__formsInternalUtils?.FORM_OPTIONS ?? FORM_OPTIONS;
}
