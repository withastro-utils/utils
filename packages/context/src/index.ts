import { AstroGlobal } from "astro";

declare global {
    export namespace App {
        export interface Locals {
            [key: string]: any
        }
    }
}

type ContextAstro = AstroGlobal | {request: Request, locals: any, props: any}
function getContextHistory(astro: ContextAstro , name: string) {
    const contexts = astro.locals.amContext ??= {};
    return contexts[name] ??= [];
}

export default function getContext(astro: ContextAstro, name = "default") {
    return getContextHistory(astro, name).at(-1) ?? {};
}

export async function asyncContext<T>(promise: () => Promise<T>, astro: ContextAstro, {name = "default", context = null} = {}): Promise<T> {
    const contextHistory = getContextHistory(astro, name);

    contextHistory.push({
        ...(context ?? astro.props),
        ...contextHistory.at(-1)
    });

    const response = await promise();

    contextHistory.pop();
    return response;
}