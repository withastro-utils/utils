import MagicString from 'magic-string';
import { parseSync } from 'oxc-parser';
import { findImportedComponents } from './imports.js';
import { rewriteFormIds } from './rewrite.js';
import fsExtra from 'fs-extra/esm';
import fs from 'fs';
import path from 'path';

const METADATA_IMPORT = 'import {createAstroFormsProps as $$createAstroFormsProps, withoutAstroFormsMetadata as $$withoutAstroFormsMetadata} from "@astro-utils/forms/internal.js";\n';

export function formIdTransform(root: string) {
    return {
        name: 'astro-utils-form-id',
        enforce: 'post',
        transform(code: string, id: string, options?: { ssr?: boolean }) {
            // The injected runtime uses Node APIs and belongs only in SSR modules.
            if (!options?.ssr) return;
            if (!id.includes('.astro') || !code.includes('$$render')) return;

            const parseResult = parseSync(id, code, { lang: 'js' });
            if (parseResult.errors.length) throw new Error(parseResult.errors[0].message);

            const imports = findImportedComponents(parseResult.program);
            if (!imports.renderTemplates.size) return;

            const source = new MagicString(code);
            rewriteFormIds(source, code, id, root, imports, parseResult.program);
            if (!source.hasChanged()) return;
            source.prepend(METADATA_IMPORT);

            return {
                code: source.toString(),
                map: source.generateMap({ hires: true })
            };
        }
    };
}
