import { createHash } from 'node:crypto';
import path from 'node:path';
import MagicString from 'magic-string';
import type { ImportedComponents } from './imports.js';

const CREATE_PROPS = '$$createAstroFormsProps';
const GENERATED_ID_LENGTH = 12;

function getPropertyName(property: any): string | undefined {
    if (property.type !== 'Property' || property.computed) return;
    if (property.key.type === 'Identifier') return property.key.name;
    if (property.key.type === 'Literal') return property.key.value;
}

function findProperty(props: any, name: string): any {
    return props.properties.find((property: any) => getPropertyName(property) === name);
}

function visitChildren(node: any, visit: (child: any) => void): void {
    for (const value of Object.values(node)) {
        if (Array.isArray(value)) {
            for (const child of value) visit(child);
        } else if (value && typeof value === 'object' && 'type' in value) {
            visit(value);
        }
    }
}

function containsAwait(node: any): boolean {
    if (!node || typeof node !== 'object') return false;
    if (node.type === 'AwaitExpression') return true;
    // Nested functions own their awaits; they don't make this expression async.
    if (['ArrowFunctionExpression', 'FunctionExpression', 'FunctionDeclaration'].includes(node.type)) return false;
    let found = false;
    visitChildren(node, child => { if (!found) found = containsAwait(child); });
    return found;
}

function createId(root: string, moduleId: string, node: any): string {
    const relativeModulePath = path.relative(root, moduleId.split('?')[0]);
    const digest = createHash('sha256').update(`${relativeModulePath}:${node.start}`).digest('hex');
    return JSON.stringify(digest.slice(0, GENERATED_ID_LENGTH));
}

function getMapCallback(node: any): any | undefined {
    if (node.type !== 'CallExpression' || node.callee?.type !== 'MemberExpression' || node.callee.computed) return;
    if (node.callee.property?.type !== 'Identifier' || node.callee.property.name !== 'map') return;

    const callback = node.arguments[0];
    if (callback?.type === 'ArrowFunctionExpression' || callback?.type === 'FunctionExpression') return callback;
}

function createGeneratedName(code: string, node: any, suffix: string): string {
    const base = `__astroForms${suffix}${node.start}`;
    let name = base;
    let attempt = 0;
    while (code.includes(name)) name = `${base}_${++attempt}`;
    return name;
}

function getMapIndex(source: MagicString, code: string, callback: any): string | undefined {
    const existingIndex = callback.params[1];
    if (existingIndex?.type === 'Identifier') return existingIndex.name;
    if (existingIndex?.type === 'AssignmentPattern' && existingIndex.left.type === 'Identifier') return existingIndex.left.name;
    if (existingIndex) return;

    const indexName = createGeneratedName(code, callback, 'Index');
    if (!callback.params.length) {
        const openingParenthesis = code.indexOf('(', callback.start);
        source.appendLeft(openingParenthesis + 1, `${createGeneratedName(code, callback, 'Value')},${indexName}`);
        return indexName;
    }

    const firstParameter = callback.params[0];
    if (firstParameter.type === 'RestElement') return;
    const hasParentheses = callback.type === 'FunctionExpression' || code.slice(callback.start, firstParameter.start).includes('(');
    if (!hasParentheses) source.appendLeft(firstParameter.start, '(');
    source.appendLeft(firstParameter.end, `,${indexName}${hasParentheses ? '' : ')'}`);
    return indexName;
}

function createMapSuffix(indices: string[]): string {
    return indices.map(index => `+":"+${index}`).join('').slice(1) || '""';
}

export function rewriteFormIds(source: MagicString, code: string, id: string, root: string, imports: ImportedComponents, ast: any): void {
    const visit = (node: any, mapIndices: string[] = []): void => {
        if (!node || typeof node !== 'object') return;

        if (node.type === 'TaggedTemplateExpression' && imports.renderTemplates.has(node.tag.name)) {
            // Astro eagerly evaluates slot callbacks. Defer expressions until the
            // provider renders them, including conditions on the first form pass.
            for (const expression of node.quasi.expressions) {
                // Literals need no deferral. Function children already defer execution
                // and are Astro's render-prop API; keep their arguments.
                if (['Literal', 'ArrowFunctionExpression', 'FunctionExpression'].includes(expression.type)) continue;
                source.prependLeft(expression.start, containsAwait(expression) ? '(async () => (' : '(() => (');
                source.appendRight(expression.end, '))');
            }
        }

        const mapCallback = getMapCallback(node);
        if (mapCallback) {
            const mapIndex = getMapIndex(source, code, mapCallback);
            visit(node.callee, mapIndices);
            for (let index = 0; index < node.arguments.length; index++) {
                const childIndices = index === 0 && mapIndex ? [...mapIndices, mapIndex] : mapIndices;
                visit(node.arguments[index], childIndices);
            }
            return;
        }

        if (node.type === 'CallExpression' && imports.attributeSpreads.has(node.callee.name)) {
            const attributes = node.arguments[0];
            if (attributes) {
                source.prependLeft(attributes.start, '$$withoutAstroFormsMetadata(');
                source.appendRight(attributes.end, ')');
            }
        }

        const isRenderComponentCall =
            node.type === 'CallExpression' &&
            imports.renderFunctions.has(node.callee.name);
        if (!isRenderComponentCall) {
            visitChildren(node, child => visit(child, mapIndices));
            return;
        }

        const props = node.arguments[3];
        if (props?.type !== 'ObjectExpression') {
            throw new Error(`Unable to add a form ID in ${id}`);
        }

        const generatedId = createId(root, id, node);
        const explicitId = findProperty(props, '__bindId');
        const componentId = explicitId ? code.slice(explicitId.value.start, explicitId.value.end) : generatedId;
        const mapSuffix = createMapSuffix(mapIndices);
        const helperOptions = explicitId ? ',{fixedId:true}' : '';
        const component = code.slice(node.arguments[2].start, node.arguments[2].end);
        source.prependLeft(props.start, `${CREATE_PROPS}(${component},`);
        source.appendRight(props.end, `,$$props.__astroForms,${componentId},${mapSuffix}${helperOptions})`);

        for (const argument of node.arguments) visit(argument, mapIndices);
    };

    visit(ast);
}
