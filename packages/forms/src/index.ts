import type PersistentFile from "formidable/PersistentFile.js";
import Bind from "./components/form-utils/bind-form.js";
import astroIntegration from "./integration.js";
import { getSessionAndFormValidation } from "./session/index.js";
import { AstroLinkHTTP } from "./utils.js";
import { endpointSession } from './session/endpoint.js';

export async function activateWebForms(astro: AstroLinkHTTP){
    const session = await getSessionAndFormValidation(astro);
    session?.save.sendCookie();

    return {session};
}

export {
    endpointSession,
    PersistentFile,
    astroIntegration as default,
    Bind
};

