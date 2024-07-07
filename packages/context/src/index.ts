import { AstroGlobal } from 'astro';

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

type ContextHistory = {
    history: any[],
    lock: Map<string, Promise<void>>;
};

function getAMContextFromAstro(astro: ContextAstro, name: string): ContextHistory {
    const amContext = astro.locals.amContext ??= new Map();

    const namedContext = amContext.get(name) ?? {
        history: [],
        lock: new Map(),
    };

    amContext.set(name, namedContext);
    return namedContext;
}

export default function getContext(astro: ContextAstro, name = "default") {
    const contexts = getAMContextFromAstro(astro, name);
    return contexts.history.at(-1) ?? {};
}

type AsyncContextOptions = { name?: string, context?: any, lock?: string; };

export async function asyncContext<T>(promise: () => Promise<T>, astro: ContextAstro, { name = "default", context = null, lock }: AsyncContextOptions = {}): Promise<T> {
    const contextState = getAMContextFromAstro(astro, name);

    while (contextState.lock.get(lock)) {
        await contextState.lock.get(lock);
    }

    contextState.history.push({
        ...contextState.history.at(-1),
        ...(context ?? astro.props)
    });

    let resolver: () => void | null;
    if (lock) contextState.lock.set(lock, new Promise<void>(resolve => resolver = resolve));

    try {
        return await promise();
    } finally {
        contextState.history.pop();
        contextState.lock.delete(lock);
        resolver?.();
    }
}
