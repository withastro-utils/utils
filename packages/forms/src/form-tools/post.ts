import AwaitLockDefault from 'await-lock';
import {AstroLinkHTTP} from '../utils.js';
import {validateFrom} from './csrf.js';

const AwaitLock = AwaitLockDefault.default || AwaitLockDefault;

export function isPost(astro: {request: Request}){
    return astro.request.method === "POST";
}

export async function parseFormData(request: Request): Promise<FormData> {
    //@ts-ignore
    const lock = request.formDataLock ??= new AwaitLock();
    await lock.acquireAsync();

    try {
        const formData = await request.formData();
        request.formData = () => Promise.resolve(formData);

        return formData;
    } finally {
        lock.release();
    }
}

export async function getFormValue(request: Request, key: string): Promise<FormDataEntryValue | null> {
    const data = await parseFormData(request);
    return data.get(key);
}

export async function getFormMultiValue(request: Request, key: string): Promise<FormDataEntryValue[]> {
    const data = await parseFormData(request);
    return data.getAll(key);
}

export async function validatePostRequest(astro: AstroLinkHTTP){
    await validateFrom(astro); // load the session & validation, the session contains the secrets for the validation
    //@ts-ignore
    return astro.request.formData.requestFormValid;
}

export async function validateAction(astro: AstroLinkHTTP, formKey: string, value: string){
    return await validatePostRequest(astro) && await getFormValue(astro.request, formKey) == value;
}
