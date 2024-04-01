import { AstroGlobal } from 'astro';

declare global {
    export namespace App {
        export interface Locals {
            [key: string]: any;
        }
    }
}

type ContextAstro = AstroGlobal | { request: Request, locals: any, props: any; };
function getContextHistory(astro: ContextAstro, name: string) {
    const contexts: Map<string, any[]> = astro.locals.amContext ??= new Map();
    contexts.set(name, contexts.get(name) ?? []);
    return contexts.get(name);
}

export default function getContext(astro: ContextAstro, name = "default") {
    return getContextHistory(astro, name).at(-1) ?? {};
}

type AsyncContextOptions = { name?: string, context?: any, lock?: string; };
const activeLock: Map<string, Map<string, Promise<void>>> = new Map();

export async function asyncContext<T>(promise: () => Promise<T>, astro: ContextAstro, { name = "default", context = null, lock }: AsyncContextOptions = {}): Promise<T> {
    activeLock.set(name, activeLock.get(name) ?? new Map());
    const lockContext = activeLock.get(name);

    while (lockContext.get(lock)) {
        await lockContext.get(lock);
    }

    const contextHistory = getContextHistory(astro, name);

    contextHistory.push({
        ...(context ?? astro.props),
        ...contextHistory.at(-1)
    });

    let resolver: () => void | null;
    if (lock) {
        lockContext.set(lock, new Promise<void>(resolve => resolver = resolve));
    }

    try {
        const response = await promise();
        contextHistory.pop();
        return response;
    } finally {
        lockContext.delete(lock);
        if(lockContext.size === 0) {
            activeLock.delete(name);
        }
        resolver?.();
    }
}
