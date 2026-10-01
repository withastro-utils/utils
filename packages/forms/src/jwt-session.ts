import {FORM_OPTIONS} from './settings.js';
import type {AstroGlobalLike} from './utils.js';
import jwt from 'jsonwebtoken';
import {serialize} from 'cookie';
import {deepStrictEqual} from 'assert';

export class JWTSession {
    private stringifyCookie?: string
    private lastData = {};
    sessionData: any = {};

    constructor(private cookies: AstroGlobalLike['cookies']) {
        this.loadData();
    }

    private loadData() {
        const cookieContent = this.cookies.get(FORM_OPTIONS.session?.cookieName!)?.value;
        if (!cookieContent) return;

        try {
            this.sessionData = (<any>jwt.verify(cookieContent, FORM_OPTIONS.secret!)).session || {};
            this.lastData = structuredClone(this.sessionData);
        } catch { }
    }

    private save() {
        try {
            deepStrictEqual(this.sessionData, this.lastData);
        } catch {
            const token = jwt.sign({session: this.sessionData}, FORM_OPTIONS.secret!, {
                expiresIn: FORM_OPTIONS.session?.cookieOptions?.maxAge!
            });
    
            this.stringifyCookie = serialize(FORM_OPTIONS?.session?.cookieName!, token, FORM_OPTIONS.session?.cookieOptions);
        }
    }

    setCookieHeader(headers: Headers) {
        this.save();
        if(this.stringifyCookie){
            headers.set('Set-Cookie', this.stringifyCookie);
        }
    }
}
