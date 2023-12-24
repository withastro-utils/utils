import Tokens from 'csrf';
import {promisify} from 'node:util';
import {type AstroLinkHTTP, createLock} from '../utils.js';
import {getFormValue, isPost} from './post.js';
import {FORM_OPTIONS, getFormOptions} from '../settings.js';

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

export async function ensureValidationSecret(astro: AstroLinkHTTP, formOptions = getFormOptions(astro)) {
    const currentSession = astro.locals.session;
    return currentSession[formOptions.csrf.sessionFiled] ??= await createSecret();
}

export async function validateFrom(astro: AstroLinkHTTP) {
    const lock = astro.request.validateFormLock ??= createLock();
    await lock.acquireAsync();

    try {
        if (!isPost(astro) || typeof astro.request.formData.requestFormValid === 'boolean') {
            return astro.request.formData.requestFormValid;
        }

        const validationSecret = await ensureValidationSecret(astro);
        const validateToken = await getFormValue(astro.request, getFormOptions(astro).csrf.formFiled);

        const requestValid = validateToken && validationSecret && typeof validateToken == 'string' &&
            tokens.verify(validationSecret, validateToken);

        return astro.request.formData.requestFormValid = Boolean(requestValid);
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
