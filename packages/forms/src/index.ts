import { AstroGlobal } from "astro";
import type PersistentFile from "formidable/PersistentFile.js";
import Bind from "./components/form-utils/bind-form.js";
import astroIntegration from "./integration.js";
import { getSessionAndFormValidation } from "./session/index.js";

export async function activateWebForms(astro: AstroGlobal){
    const session = await getSessionAndFormValidation(astro);
    //@ts-ignore
    session?.save.sendCookie();

    return {session};
}

export {
    PersistentFile,
    astroIntegration as default,
    Bind
}