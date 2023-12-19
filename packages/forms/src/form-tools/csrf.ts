import Tokens from 'csrf';
import {promisify} from 'node:util';
import {AstroLinkHTTP} from '../utils.js';
import {getFormValue, isPost} from './post.js';
import {FORM_OPTIONS} from '../settings.js';
import AwaitLockDefault from 'await-lock';

const AwaitLock = AwaitLockDefault.default || AwaitLockDefault;

export type CSRFSettings = {
    formFiled: string,
    sessionFiled: string
}

export const DEFAULT_SETTINGS: CSRFSettings = {
    formFiled: 'request-validation-token',
    sessionFiled: 'request-validation-secret'
};

const tokens = new Tokens();
const createSecret = () => promisify(tokens.secret.bind(tokens))();

export async function ensureValidationSecret(astro: AstroLinkHTTP) {
    const currentSession = astro.locals.session;
    return currentSession[FORM_OPTIONS.csrf.sessionFiled] ??= await createSecret();
}

export async function validateFrom(astro: AstroLinkHTTP) {
    //@ts-ignore
    const lock = astro.request.validateFormLock ??= new AwaitLock();
    await lock.acquireAsync();

    try {
        //@ts-ignore
        if (!isPost(astro) || typeof astro.request.formData.requestFormValid == 'boolean') return;

        const validationSecret = await ensureValidationSecret(astro);
        const validateToken = await getFormValue(astro.request, FORM_OPTIONS.csrf.formFiled);
        const requestValid = validateToken && validationSecret && typeof validateToken == 'string' &&
            tokens.verify(validationSecret, validateToken);

        //@ts-ignore
        astro.request.formData.requestFormValid = Boolean(requestValid);
    } finally {
        lock.release();
    }
}

export async function createFormToken(astro: AstroLinkHTTP) {
    const validationSecret = await ensureValidationSecret(astro);
    const token = tokens.create(validationSecret);

    return {
        token,
        filed: FORM_OPTIONS.csrf.formFiled
    };
}
