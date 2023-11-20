# Astro Context

Save context between components

Allow you to add extra props without the need to manually add them every time

## Usage

`layouts/Layout.astro`
```astro
---
import Context from '@astro-utils/context/Context.astro';

function consoleIt(){
    console.log('Hi');
}
---
<Context title="Context is cool" consoleIt={consoleIt}>
    <slot/>
</Context>
```

`components/LayoutTitle.astro`
```astro
---
import getContextProps from '@astro-utils';

const {title, consoleIt} = getContextProps(Astro);
consoleIt();
---
<h2>{title}</h2>
```

`pages/index.astro`

```astro
---
import Layout from '../layouts/Layout.astro';
import LayoutTitle from '../components/LayoutTitle.astro';
---
<Layout>
    <LayoutTitle/>
</Layout>
```

## Functions

```ts
// remember to change the name if you have multiple contexts
function getContextProps(astro: AstroGlobal, name = "default"): {[key: string]: any}
```

Every new context inherits the last one


```ts
async function readerInContext<T>(promise: () => Promise<T>, astro: AstroGlobal, name = "default"): Promise<T>
```

Same as `Context.astro`, help you render astro inside the props context
