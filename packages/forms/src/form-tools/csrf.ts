import Tokens from 'csrf';
import {withLock} from 'lifecycle-utils';
import {promisify} from 'node:util';
import {type AstroGlobalLike} from '../utils.js';
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

export async function ensureValidationSecret(astro: AstroGlobalLike, formOptions = getFormOptions(astro)) {
    const currentSession = astro.locals.session;
    return currentSession[formOptions.csrf!.sessionFiled] ??= await createSecret();
}

export async function validateFrom(astro: AstroGlobalLike) {
    return await withLock([astro.request, 'validateForm'], async () => {
        if (!isPost(astro) || typeof astro.request.formData.requestFormValid === 'boolean') {
            return astro.request.formData.requestFormValid;
        }

        const validationSecret = await ensureValidationSecret(astro);
        const validateToken = await getFormValue(astro.request, getFormOptions(astro).csrf!.formFiled);

        const requestValid = validateToken && validationSecret && typeof validateToken == 'string' &&
            tokens.verify(validationSecret, validateToken);

        return astro.request.formData.requestFormValid = Boolean(requestValid);
    });
}

export async function createFormToken(astro: AstroGlobalLike) {
    const validationSecret = await ensureValidationSecret(astro);
    const token = tokens.create(validationSecret);

    return {
        token,
        filed: FORM_OPTIONS.csrf!.formFiled
    };
}
