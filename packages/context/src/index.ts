import { AstroGlobal } from "astro";

type ContextAstro = AstroGlobal | {request: Request, props: any}
function getContext(astro: ContextAstro , name: string) {
    //@ts-ignore
    const contexts = astro.request.context ??= {};
    return contexts[name] ??= [];
}

export default function getContextProps(astro: ContextAstro, name = "default") {
    return getContext(astro, name).at(-1) ?? {};
}

export async function readerInContext<T>(promise: () => Promise<T>, astro: ContextAstro, name = "default"): Promise<T> {
    const contextHistory = getContext(astro, name);

    contextHistory.push({
        ...astro.props,
        ...contextHistory.at(-1)
    });

    const response = await promise();

    contextHistory.pop();
    return response;
}