import type { AstroGlobal } from 'astro';

export function claimGeneratedId(Astro: AstroGlobal, id: string, generated: boolean, componentName: string): () => void {
    if (!generated) return () => {};

    const activeIds = Astro.locals.__formsInternalUtils.activeGeneratedIds;
    if (activeIds.has(id)) {
        throw new Error(`Provide a unique ID when rendering ${componentName} in a loop.`);
    }

    activeIds.add(id);
    return () => activeIds.delete(id);
}