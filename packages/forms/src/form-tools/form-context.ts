import { createHash } from 'node:crypto';
import { AsyncLocalStorage } from 'node:async_hooks';
import type { AstroGlobal } from 'astro';

const ID_LENGTH = 12;
const formScope = new AsyncLocalStorage<{ locals: AstroGlobal['locals']; context: Record<string, any> }>();

function createScopedId(parentId: string | undefined, id: string, mapScope: string): string {
    return createHash('sha256').update(`${ parentId ?? '' }:${ id }:${ mapScope }`).digest('hex').slice(0, ID_LENGTH);
}

export interface AstroFormsMetadata {
    id: string;
    mapScope: string;
    generated?: boolean;
}

export interface AstroFormsProps {
    /** @internal */
    __astroForms?: () => AstroFormsMetadata;
}

interface AstroFormsMetadataOptions {
    fixedId?: boolean;
}

export function createAstroFormsMetadata(
    parent: AstroFormsProps['__astroForms'],
    id: string,
    mapSuffix = '',
    options: AstroFormsMetadataOptions = {}
): AstroFormsProps['__astroForms'] {
    const parentMetadata = parent?.();
    const mapScope = (parentMetadata?.mapScope ?? '') + mapSuffix;
    const scopedId = createScopedId(parentMetadata?.id, id, mapScope);
    const metadata: AstroFormsMetadata = {
        id: options.fixedId ? id : scopedId,
        mapScope,
        generated: !options.fixedId
    };
    return () => metadata;
}

// The transformer passes a fresh props object, so no copy is needed here.
export function createAstroFormsProps(
    component: any,
    props: Record<string, any>,
    parent: AstroFormsProps['__astroForms'],
    id: string,
    mapSuffix = '',
    options: AstroFormsMetadataOptions = {}
): Record<string, any> {
    // Use the same factory marker as Astro's renderer, including dynamic targets.
    if (component?.isAstroComponentFactory === true) {
        props.__astroForms = createAstroFormsMetadata(parent, id, mapSuffix, options);
    } else {
        delete props.__astroForms;
    }
    return props;
}

export function withoutAstroFormsMetadata(props: Record<string, any>): Record<string, any> {
    if (!props || !Object.prototype.hasOwnProperty.call(props, '__astroForms')) return props;
    const { __astroForms, ...attributes } = props;
    return attributes;
}

export function getAstroFormsMetadata(astro: AstroGlobal): AstroFormsMetadata | undefined {
    return astro.props.__astroForms?.();
}

export function getFormContext(astro: AstroGlobal): Record<string, any> {
    const scope = formScope.getStore();
    return scope?.locals === astro.locals ? scope.context : astro.locals.__formsInternalUtils.rootContext;
}

export function asyncRootFormContext<T>(promise: () => Promise<T>, astro: AstroGlobal, context: Record<string, any>): Promise<T> {
    return formScope.run({ locals: astro.locals, context }, promise);
}

export function asyncFormContext<T>(promise: () => Promise<T>, astro: AstroGlobal, context: Record<string, any>): Promise<T> {
    return asyncRootFormContext(promise, astro, { ...getFormContext(astro), ...context });
}
