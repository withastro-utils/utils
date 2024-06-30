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

type AMContext = {
    lock: Map<string, any>;
    history: Map<string, any[]>;
};

function getAMContextFromAstro(astro: ContextAstro, name: string) {
    const amContext = astro.locals.amContext ??= {
        lock: new Map(),
        history: new Map()
    };

    amContext.history.set(name, amContext.history.get(name) ?? []);
    return amContext;
}

async function getContextHistoryAfterLock(astro: ContextAstro, name: string, lock?: string) {
    const contexts: AMContext = getAMContextFromAstro(astro, name);

    while (contexts.lock.get(lock)) {
        await contexts.lock.get(lock);
    }

    return {
        value: contexts.history.get(name),
        lock: contexts.lock
    };
}

export default function getContext(astro: ContextAstro, name = "default") {
    const contexts: AMContext = getAMContextFromAstro(astro, name);
    return contexts.history.get(name).at(-1) ?? {};
}

type AsyncContextOptions = { name?: string, context?: any, lock?: string; };

export async function asyncContext<T>(promise: () => Promise<T>, astro: ContextAstro, { name = "default", context = null, lock }: AsyncContextOptions = {}): Promise<T> {
    const contextHistory = await getContextHistoryAfterLock(astro, name);

    contextHistory.value.push({
        ...contextHistory.value.at(-1),
        ...(context ?? astro.props)
    });

    let resolver: () => void | null;
    if (lock) {
        contextHistory.lock.set(lock, new Promise<void>(resolve => resolver = resolve));
    }

    try {
        const response = await promise();
        contextHistory.value.pop();
        return response;
    } finally {
        contextHistory.lock.delete(lock);
        resolver?.();
    }
}
