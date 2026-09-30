export interface ImportedComponents {
    renderFunctions: Set<string>;
    renderTemplates: Set<string>;
    attributeSpreads: Set<string>;
}

export function findImportedComponents(ast: any): ImportedComponents {
    const renderFunctions = new Set<string>();
    const renderTemplates = new Set<string>();
    const attributeSpreads = new Set<string>();

    for (const node of ast.body) {
        if (node.type !== 'ImportDeclaration' || !['astro/compiler-runtime', 'astro/runtime/server/index.js', 'astro/server'].includes(node.source.value)) continue;
        for (const specifier of node.specifiers) {
            if (specifier.type !== 'ImportSpecifier') continue;
            if (specifier.imported.name === 'renderComponent') renderFunctions.add(specifier.local.name);
            if (specifier.imported.name === 'render') renderTemplates.add(specifier.local.name);
            if (specifier.imported.name === 'spreadAttributes') attributeSpreads.add(specifier.local.name);
        }
    }

    return { renderFunctions, renderTemplates, attributeSpreads };
}
