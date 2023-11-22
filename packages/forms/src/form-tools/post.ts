import parseAstroForm, {ExtendedFormData, FormDataValue, VolatileFile} from '@astro-utils/formidable';
import {FORM_OPTIONS} from '../settings.js';
import {AstroLinkHTTP} from '../utils.js';
import {validateFrom} from './csrf.js';
import AwaitLock from 'await-lock';

export function isPost(astro: {request: Request}){
    return astro.request.method === "POST";
}

function extractDeleteMethods(formData: ExtendedFormData | FormData){
    return [...formData].map(([_, value]) => {
        if (value instanceof VolatileFile) {
            return value.destroy.bind(value);
        }
    }).filter(Boolean);
}

export function deleteFormFiles(request: AstroLinkHTTP['request']) {
    //@ts-ignore
    request.formData?.deleteFiles?.forEach(fn => fn());
}

export async function parseFormData(request: Request): Promise<ExtendedFormData> {
    //@ts-ignore
    const lock = request.formDataLock ??= new AwaitLock();
    await lock.acquireAsync();

    try {
        if(request.formData.name === ''){ // this is the anonymous function we created
            return await request.formData() as any;
        }

        const formData = await parseAstroForm(request, FORM_OPTIONS.forms);
        request.formData = () => <any>Promise.resolve(formData);
        //@ts-ignore
        request.formData.deleteFiles = extractDeleteMethods(formData);
        return formData;
    } finally {
        lock.release();
    }
}

export async function getFormValue(request: Request, key: string): Promise<FormDataValue | null>{
    const data = await parseFormData(request);
    return data.get(key) as any;
}

export async function getFormMultiValue(request: Request, key: string): Promise<FormDataValue[]> {
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
