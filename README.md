<div align="center">

# Astro Utils

<img src="./assets/logo.rounded.png" alt="Astro Utils" height="300px"/>


[![Build](https://github.com/withastro-utils/utils/actions/workflows/release.yml/badge.svg)](https://github.com/withastro-utils/utils/actions/workflows/build.yml)
[![License](https://badgen.net/badge/color/MIT/green?label=license)](https://www.npmjs.com/package/@astro-utils/forms)
[![License](https://badgen.net/badge/color/TypeScript/blue?label=types)](https://www.npmjs.com/package/@astro-utils/forms)
[![Version](https://badgen.net/npm/v/@astro-utils/forms)](https://www.npmjs.com/package/@astro-utils/forms)
</div>

> Components to help with your astro app

### What that includes?
- [Reactive Forms](./packages/forms/README.md) - feel native as regular HTML
- [Formidable (for astro)](./packages/formidable/README.md) - parse astro formsData
- [Component Context](./packages/context/README.md) - extra props base on context


# Full feature form control for Astro.js

Allow client side & server side validation and CSRF protection.

Export JWT session that can be used in every page.

## Usage

Add the middleware to your server


`src/middleware.ts`
```ts
import astroForms from "@astro-utils/forms";
import {sequence} from "astro/middleware";

export const onRequest = sequence(astroForms());
```

Add the `WebForms` component in the layout

`layouts/Layout.astro`
```astro
---
import {WebForms} from '@astro-utils/forms/forms.js';
---
<WebForms>
    <slot/>
</WebForms>
```

### Simple example
```astro
---
import { Bind } from "@astro-utils/forms";
import { BindForm, Button, Input } from "@astro-utils/forms/forms.js";
import Layout from "../layouts/Layout.astro";

const form = Bind();
let showSubmitText: string;

function formSubmit(){
    showSubmitText = `You name is ${form.name}, you are ${form.age} years old. `;
}
---
<Layout>
    <BindForm bind={form}>
        {showSubmitText}

        <h4>What you name*</h4>
        <Input type={'text'} name="name" maxlength={20} required/>
    
        <h4>Enter age*</h4>
        <Input type={'int'} name="age" required/>
    
        <Button onClick={formSubmit} whenFormOK>Submit</Button>
    </BindForm>
</Layout>
```

### Easy debugging
When vite reloads the page, the browser will popup confirmation dialog. This is annoying when you are debugging. You can disable this by using the astro-utils integration

`astro.config.mjs`
```js
import { defineConfig } from 'astro/config';
import astroFormsDebug from "@astro-utils/forms/dist/integration.js";

export default defineConfig({
	output: 'server',
    integrations: [astroFormsDebug]
});
```
