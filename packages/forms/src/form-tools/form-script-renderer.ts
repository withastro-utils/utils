import { AsyncLocalStorage } from 'node:async_hooks';
import { randomUUID } from 'node:crypto';

interface ScriptScope {
    token: string;
    scripts: (() => Promise<string>)[];
}

const scriptScope = new AsyncLocalStorage<ScriptScope>();

// Nested forms share the outer buffer: their retained HTML may still be discarded
// by an outer form. Only the outermost form commits the scripts in its chosen HTML.
export function createFormScriptRenderer() {
    const parent = scriptScope.getStore();
    const scope = parent ?? { token: randomUUID(), scripts: [] };

    return {
        render<T>(callback: () => Promise<T>): Promise<T> {
            return scriptScope.run(scope, callback);
        },
        async finish(html = ''): Promise<string> {
            if (parent || !html || !scope.scripts.length) return html;
            const marker = new RegExp(`<!--astro-forms-script:${ scope.token }:(\\d+)-->`, 'g');
            const parts: string[] = [];
            let offset = 0;
            for (const match of html.matchAll(marker)) {
                parts.push(html.slice(offset, match.index), await scope.scripts[Number(match[1])]());
                offset = match.index! + match[0].length;
            }
            parts.push(html.slice(offset));
            return parts.join('');
        },
    };
}

// Defer the original renderer as well as serialization: either can deduplicate.
// Astro's serializer accepts both older HTML results and newer instructions.
export function renderFormScript<Result>(renderScript: (result: Result, id: string) => unknown | Promise<unknown>, stringify: (result: Result, instruction: unknown) => string, result: Result, id: string) {
    const scope = scriptScope.getStore();
    if (!scope) return renderScript(result, id);

    const index = scope.scripts.push(async () => {
        const instruction = await renderScript(result, id);
        return instruction == null ? '' : String(stringify(result, instruction));
    }) - 1;
    const marker = `<!--astro-forms-script:${ scope.token }:${ index }-->`;
    return {
        render(destination: { write(chunk: string): void }) {
            destination.write(marker);
        },
    };
}
