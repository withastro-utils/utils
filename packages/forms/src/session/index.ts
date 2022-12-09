import { AstroGlobal } from "astro";
import type { RequestHandler } from "express";
import { promisify } from "util";
import expressSessionAPI from "../express-tools/express-session-api.js";
import { validateFrom } from "../form-tools/csrf.js";
import { formsSettings } from "../settings.js";

let sessionHandler: RequestHandler;
export function initSession(sessionCreator: () => RequestHandler) {
    if (sessionHandler != null) return;
    sessionHandler = sessionCreator();
}

export async function connectSessionRequest(astro: AstroGlobal): Promise<{ [key: string]: any }> {
    const request: any = astro.request;
    if (request.session) return request.session;
    request.session = await expressSessionAPI(astro, sessionHandler);

    return request.session;
}

export async function saveSession(astro: AstroGlobal) {
    //@ts-ignore-next
    const session = astro.request.session;
    if (!session) return;

    await promisify(session.save.bind(session))();
}

/**
 * Getting the session and session and doing one-time validation to the form data
 * @param astro 
 * @returns 
 */
 export async function getSessionAndFormValidation(astro: AstroGlobal){
    // @ts-ignore
    if(astro.request.session) return astro.request.session;// @ts-ignore
    astro.request.session ??= await connectSessionRequest(astro);

    await validateFrom(astro, formsSettings.csrf); // @ts-ignore
    return astro.request.session;
}