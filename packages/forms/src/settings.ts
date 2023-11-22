// @ts-ignore
import {Options as formidableOptions} from 'formidable';
import {CSRFSettings} from './form-tools/csrf.js';

export type FormsSettings = {
    csrf?: CSRFSettings
    forms?: formidableOptions
    session?: {
        cookieName: string
        cookieOptions: {
            httpOnly: boolean
            sameSite: boolean | 'lax' | 'strict' | 'none'
            maxAge: number
        }
    },
    secret?: string
}

/// <reference types="astro/client" />
declare namespace App {
    export interface Locals {
        session: { [key: string]: any };
    }
}


export const FORM_OPTIONS: FormsSettings = {} as any;
