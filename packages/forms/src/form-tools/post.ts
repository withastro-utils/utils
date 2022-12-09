import parseAstroForm, { isFormidableFile } from "@astro-metro/formidable";
import ExtendedFormData from "@astro-metro/formidable/dist/ExtendedFormData.js";
import { AstroGlobal } from "astro";
import { getSessionAndFormValidation } from "../session/index.js";
import { formsSettings } from "../settings.js";

export function isPost(astro: AstroGlobal){
    return astro.request.method === "POST";
}

function extractDeleteMethods(formData: ExtendedFormData | FormData){
    return [...formData].map(([_, value]) => {
        if(isFormidableFile(value)){
            return value.destroy.bind(value);
        }
    }).filter(Boolean);
}

export async function parseFormData(astro: AstroGlobal){
    if(astro.request.formData.name === ''){ // this is the anonymous function we created
        return astro.request.formData();
    }

    const formData = await parseAstroForm(astro.request, formsSettings.forms);
    //@ts-ignore
    astro.request.formData.deleteFiles = extractDeleteMethods(formData);
    astro.request.formData = () => <any>Promise.resolve(formData);
    return formData;
}

export async function getFormValue(astro: AstroGlobal, key: string){
    const data = await parseFormData(astro);
    return data.get(key);
}

export async function getFormMultiValue(astro: AstroGlobal, key: string){
    const data = await parseFormData(astro);
    return data.getAll(key);
}

export async function validatePostRequest(astro: AstroGlobal){
    await getSessionAndFormValidation(astro); // load the session & validation, the session contains the secrets for the validation
    //@ts-ignore
    return astro.request.formData.requestFormValid;
}

export async function validateAction(astro: AstroGlobal, formKey: string, value: string){
    return await validatePostRequest(astro) && await getFormValue(astro, formKey) == value;
}