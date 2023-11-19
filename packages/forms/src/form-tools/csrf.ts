import Tokens from 'csrf';
import {promisify} from 'node:util';
import {AstroLinkHTTP} from '../utils.js';
import {getFormValue, isPost} from './post.js';

export type CSRFSettings = {
    formFiled: string,
    sessionFiled: string
}

const DEFAULT_SETTINGS: CSRFSettings = {
    formFiled: 'request-validation-token',
    sessionFiled: 'request-validation-secret'
}

const tokens = new Tokens();
const createSecret = () => promisify(tokens.secret.bind(tokens))();

export async function validateFrom(astro: AstroLinkHTTP, settings: CSRFSettings = DEFAULT_SETTINGS) {
    //@ts-ignore
    if(!isPost(astro) || typeof astro.request.formData.requestFormValid == 'boolean') return;

    const currentSession = astro.locals.session;
    const validateToken = await getFormValue(astro.request, settings.formFiled);
    const validationSecret = currentSession[settings.sessionFiled] ??= await createSecret();

    const requestValid = validateToken && validationSecret && typeof validateToken == 'string' &&
        tokens.verify(validationSecret, validateToken);

    //@ts-ignore
    astro.request.formData.requestFormValid = Boolean(requestValid);
}

export async function createFormToken(astro: AstroLinkHTTP, settings: CSRFSettings = DEFAULT_SETTINGS) {
    const currentSession = astro.locals.session;
    currentSession[settings.sessionFiled] ??= await promisify(tokens.secret.bind(tokens))();

    const token = tokens.create(currentSession[settings.sessionFiled]);
    return {
        token,
        filed: settings.formFiled
    }
}
