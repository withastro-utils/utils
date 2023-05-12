# Astro Metro

![Astro metro icon](./assets/banner.webp)

Components to help with your astro app

Packages:
- [Form binding & validation](./packages/forms/README.md) - feel native as regular HTML
- [Astro formidable](./packages/formidable/README.md) - parse astro forms
- [Astro component context](./packages/context/README.md) - extra props base on context


# Full feature form control for Astro.js

Allow client side & server side validation and CSRF protection. Alow export a session the you can use in your pages

## Usage

Add the middleware to your server


`src/middleware.ts`
```ts
import amMiddleware from "@astro-metro/forms";
import {sequence} from "astro/middleware";

export const onRequest = sequence(amMiddleware());
```

Add the `WebForms` component in the layout

`layouts/Layout.astro`
```astro
---
import {WebForms} from '@astro-metro/forms/forms.js';
---
<WebForms>
    <slot/>
</WebForms>
```

### Simple example
```astro
---
import { Bind } from "@astro-metro/forms";
import { BindForm, Button, Input } from "@astro-metro/forms/forms.js";
import Layout from "../layouts/Layout.astro";

const form = Bind();
let showSubmitText: string;

function formSubmit(){
    showSubmitText = `You name is ${form.name}, you are ${form.age} years old. `;
}
---
<Layout>
    {showSubmitText}

    <BindForm bind={form}>
        <h4>What you name*</h4>
        <Input type={'text'} name="name" maxlength={20} required/>
    
        <h4>Enter age*</h4>
        <Input type={'int'} name="age" required/>
    
        <Button onClick={formSubmit} whenFormOK>Submit</Button>
    </BindForm>
</Layout>
```

### Easy debugging
When vite reloads the page, the browser will popup confirmation dialog. This is annoying when you are debugging. You can disable this by using the astro-metro integration

`astro.config.mjs`
```js
import { defineConfig } from 'astro/config';
import amDebug from "@astro-metro/forms/dist/integration.js";

export default defineConfig({
	output: 'server',
	integrations: [amDebug],
	experimental: {
		middleware: true
	}
});
```