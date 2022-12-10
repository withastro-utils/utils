import { APIContext, EndpointOutput } from "astro";
import { getSessionAndFormValidation } from "./index.js";

type APIRouteSessionContext = APIContext & {session: any};
type APIResponseJSON = {json: {[key: string]: any}}
type APIResponse = EndpointOutput | Response | APIResponseJSON | Promise<EndpointOutput | Response | APIResponseJSON>
type APIRouteSession = (context: APIRouteSessionContext) => APIResponse;

function connectHeadersToResponse(response: EndpointOutput | Response | APIResponseJSON, headers: Headers){
    if(response instanceof Response){
        for(const [key, value] of headers.entries()){
            response.headers.append(key, value);
        }
    } else if('json' in response){
        headers.set('content-type', 'application/json;charset=utf-8');
        return new Response(JSON.stringify(response.json), {headers});
    }
    return response;
}

export function endpointSession(method: APIRouteSession) {
    return async (context: APIContext) => {
        const contextSession: APIRouteSessionContext = <any>context;
        
        const headers = new Headers();
        const session = await getSessionAndFormValidation({request: context.request, response: {headers}});
        contextSession.session = session;

        const funcResponse = await method(contextSession);
        session.save.sendCookie();
        session.save();

        return connectHeadersToResponse(funcResponse, headers);
    }
}