<div align="center">

<img src="https://raw.githubusercontent.com/withastro-utils/utils/main/assets/logo.svg" alt="Astro Utils rocket and toolkit logo" width="112" height="112" />

# Astro Utils Context

**Share values across your Astro component tree.**

[![npm version](https://img.shields.io/npm/v/@astro-utils/context?color=0b6ead&style=flat-square)](https://www.npmjs.com/package/@astro-utils/context)
[![MIT license](https://img.shields.io/badge/license-MIT-82cfff?style=flat-square)](https://github.com/withastro-utils/utils/blob/main/LICENSE)
[![Documentation](https://img.shields.io/badge/docs-explore-0b6ead?style=flat-square)](https://withastro-utils.github.io/docs/)

[Documentation](https://withastro-utils.github.io/docs/) · [Examples](https://withastro-utils.github.io/docs/examples/) · [AI agent guide](https://withastro-utils.github.io/docs/llms.txt)

</div>

Provide values once in a layout and read them in nested components. Context exists during a render; it is not a browser store or persistent session.

**Supports Astro 7 and parallel async rendering.** Context now uses Node's `AsyncLocalStorage` from `node:async_hooks` instead of a shared render stack. Values follow the async execution started inside their provider, including across `await`, while overlapping providers and separate requests keep their own context. The `Context.astro`, `getContext`, and `asyncContext` APIs stay the same.

## Install

```sh
npm install @astro-utils/context
```

## Provide → read → render

**`src/components/Button.astro`**

```astro
---
import getContext from '@astro-utils/context';
const { buttonColor } = getContext(Astro, 'buttons');
---
<button style={{ color: buttonColor }}>
    </slot>
</button>
```

**`src/pages/index.astro`**

```astro
---
import Layout from '../layouts/Layout.astro';
import PageHeading from '../components/PageHeading.astro';
import Context from '@astro-utils/context/Context.astro';

---
<Layout title="Context Demo">
    <h1>Colorful buttons</h1>

    <Context buttonColor="red">
        <Button>Click Red</Button>
        <Button>Red button</Button>
    </Context>

    <Context buttonColor="blue">
        <Button>Click Blue</Button>
        <Button>Blue button</Button>
    </Context>
</Layout>
```

## Parallel async context

Use `asyncContext` to start work inside a context. Parallel calls inherit their parent's values, and each call can override values without changing its siblings' context:

```ts
import getContext, { asyncContext } from '@astro-utils/context';

const [firstTitle, secondTitle] = await Promise.all(
        asyncContext(() => {
            return Astro.slots.default();
        }, Astro, { name: 'task', context: { title: "First Title" } }),

        asyncContext(() => {
            return Astro.slots.default();
        }, Astro, { name: 'task', context: { title: "Second Title" } })
);
```

Context no longer uses locks: parallel providers keep independent async scopes.

## Know the boundaries

- Nested providers with the same name inherit values and can override them.
- `getContext(Astro, name)` returns `{}` when no provider is active; the default name is `"default"`.
- `asyncContext` supports manual async rendering with context.
- The server runtime must support Node's `node:async_hooks` and `AsyncLocalStorage`.

[Full walkthrough](https://withastro-utils.github.io/docs/guides/context/) · [API reference](https://withastro-utils.github.io/docs/reference/context/)

## Support Astro Utils

If Astro Utils helps you build, a star on [GitHub](https://github.com/withastro-utils/utils) is appreciated. Bug reports, useful examples, and pull requests help too. Thank you for supporting the project.

[MIT license](https://github.com/withastro-utils/utils/blob/main/LICENSE)
