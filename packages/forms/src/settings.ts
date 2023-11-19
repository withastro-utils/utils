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

declare global {
    export namespace App {
        export interface Locals {
            session: any;
            [key: string]: any
        }
    }
}

export const FORM_OPTIONS: FormsSettings = {} as any;
