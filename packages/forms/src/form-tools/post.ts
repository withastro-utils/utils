import {type AstroLinkHTTP, createLock, type ExtendedRequest} from '../utils.js';
import {validateFrom} from './csrf.js';


export function isPost(astro: {request: Request}){
    return astro.request.method === "POST";
}

export async function parseFormData(request: ExtendedRequest): Promise<FormData> {
    const lock = request.formDataLock ??= createLock();
    await lock.acquireAsync();

    try {
        const formData = await request.formData();
        request.formData = () => Promise.resolve(formData);

        return formData;
    } finally {
        lock.release();
    }
}

export async function getFormValue(request: ExtendedRequest, key: string): Promise<FormDataEntryValue | null> {
    const data = await parseFormData(request);
    return data.get(key);
}

export async function getFormMultiValue(request: ExtendedRequest, key: string): Promise<FormDataEntryValue[]> {
    const data = await parseFormData(request);
    return data.getAll(key);
}

export async function validateAction(astro: AstroLinkHTTP, formKey: string, value: string){
    return await validateFrom(astro) && await getFormValue(astro.request, formKey) == value;
}
