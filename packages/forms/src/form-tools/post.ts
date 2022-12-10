import parseAstroForm, { isFormidableFile } from "@astro-metro/formidable";
import ExtendedFormData from "@astro-metro/formidable/dist/ExtendedFormData.js";
import { getSessionAndFormValidation } from "../session/index.js";
import { formsSettings } from "../settings.js";
import { AstroLinkHTTP } from "../utils.js";

export function isPost(astro: {request: Request}){
    return astro.request.method === "POST";
}

function extractDeleteMethods(formData: ExtendedFormData | FormData){
    return [...formData].map(([_, value]) => {
        if(isFormidableFile(value)){
            return value.destroy.bind(value);
        }
    }).filter(Boolean);
}

export async function parseFormData(request: Request){
    if(request.formData.name === ''){ // this is the anonymous function we created
        return request.formData();
    }

    const formData = await parseAstroForm(request, formsSettings.forms);
    //@ts-ignore
    request.formData.deleteFiles = extractDeleteMethods(formData);
    request.formData = () => <any>Promise.resolve(formData);
    return formData;
}

export async function getFormValue(request: Request, key: string){
    const data = await parseFormData(request);
    return data.get(key);
}

export async function getFormMultiValue(request: Request, key: string){
    const data = await parseFormData(request);
    return data.getAll(key);
}

export async function validatePostRequest(astro: AstroLinkHTTP){
    await getSessionAndFormValidation(astro); // load the session & validation, the session contains the secrets for the validation
    //@ts-ignore
    return astro.request.formData.requestFormValid;
}

export async function validateAction(astro: AstroLinkHTTP, formKey: string, value: string){
    return await validatePostRequest(astro) && await getFormValue(astro.request, formKey) == value;
}