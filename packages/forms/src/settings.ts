import { CSRFSettings } from "./form-tools/csrf.js";
import { initSession } from "./session/index.js"; // @ts-ignore
import {Options as formidableOptions, querystring, multipart} from 'formidable'
import type { RequestHandler } from "express";
import { defaultAstroSession } from "./session/default-session.js";

export type FormsSettings = {
    init?: boolean,
    session?: (settings?: FormsSettings) => RequestHandler
    csrf?: CSRFSettings
    forms?: formidableOptions
}

export const formsSettings: FormsSettings = {
    init: false,
    session: defaultAstroSession,
    forms: {
        allowEmptyFiles: true,
        minFileSize: 0,
        multiples: true,
        enabledPlugins: [querystring, multipart]
    }
};

export async function initialize(importSettings: FormsSettings = {}){
    if(formsSettings.init) return;

    Object.assign(formsSettings, importSettings);
    formsSettings.init = true;

    const createSession = formsSettings.session && (() => formsSettings.session(formsSettings));
    initSession(createSession);
}