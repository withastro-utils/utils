import { AstroGlobal } from "astro";
import type { RequestHandler } from "express";
import { promisify } from "util";
import { AstroLinkHTTP } from "../utils.js";

export function fakeRequest(request: Request){
    const header = (key: string) => request.headers.get(key);

    return {
        headers: new Proxy(request.headers, {
            get: (target, prop) => target.get(<any>prop)
        }),
        header,
        get: header
    };
}

function fakeResponse(response: AstroGlobal['response']){
    function setHeader(key: string, values: string | string[]){
        values = Array.isArray(values) ? values: [values];

        for(const value of values){
            response.headers.append(key, value);
        }
    }

    return {
        getHeader(key: string){
            return response.headers.get(key);
        },
        setHeader,
        header: setHeader,
        writeHead: () => {}
    };
}

export function proxyGet(object: any, toProxy: any){
    return new Proxy(object, {
        get: (target, key) => target[key] ?? toProxy[key],
        set(target, key, value){
            target[key] = value;
            return true;
        }
    })
}

export default async function expressSessionAPI(astro: AstroLinkHTTP, sessionHandler: RequestHandler){
    const req = proxyGet(fakeRequest(astro.request), astro.request);
    const res = fakeResponse(astro.response);

    await promisify(sessionHandler)(<any>req, <any>res);
    req.session.save.sendCookie = () => res.writeHead();

    return req.session;
}