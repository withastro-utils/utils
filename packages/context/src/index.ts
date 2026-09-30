import { AsyncLocalStorage } from 'node:async_hooks';
import type { AstroGlobal } from 'astro';

declare global {
    export namespace App {
        export interface Locals {
            [key: string]: any;
        }
    }
}

type ContextAstro = AstroGlobal | {
    request: Request,
    locals: any,
    props: any;
};

const contextScope = new AsyncLocalStorage<{ locals: ContextAstro['locals'], contexts: Map<string, any> }>();

function getContexts(astro: ContextAstro): Map<string, any> | undefined {
    const scope = contextScope.getStore();
    return scope?.locals === astro.locals ? scope?.contexts : undefined;
}

export default function getContext(astro: ContextAstro, name = "default") {
    return getContexts(astro)?.get(name) ?? {};
}

type AsyncContextOptions = {
    name?: string;
    context?: any;
    /** @deprecated Context is isolated by AsyncLocalStorage; this option is ignored. */
    lock?: string;
};

export async function asyncContext<T>(promise: () => Promise<T>, astro: ContextAstro, { name = "default", context = null }: AsyncContextOptions = {}): Promise<T> {
    const contexts = new Map(getContexts(astro));
    contexts.set(name, {
        ...contexts.get(name),
        ...(context ?? astro.props)
    });

    return contextScope.run({ locals: astro.locals, contexts }, promise);
}
