<div align="center">

# Astro Forms Utils

<img src="./assets/logo.rounded.png" alt="Astro Utils" height="300px"/>


[![Build](https://github.com/withastro-utils/utils/actions/workflows/release.yml/badge.svg)](https://github.com/withastro-utils/utils/actions/workflows/build.yml)
[![License](https://badgen.net/badge/color/MIT/green?label=license)](https://www.npmjs.com/package/@astro-utils/forms)
[![License](https://badgen.net/badge/color/TypeScript/blue?label=types)](https://www.npmjs.com/package/@astro-utils/forms)
[![Version](https://badgen.net/npm/v/@astro-utils/forms)](https://www.npmjs.com/package/@astro-utils/forms)
</div>

> Server component for Astro (validation and state management)


# Full feature server components for Astro.js

This package is a framework for Astro.js that allows you to create forms and manage their state without any JavaScript.

It also allows you to validate the form on the client side and server side, and protect against CSRF attacks.

### More features
- JWT session management
- Override response at runtime (useful for error handling)
- Custom server validation with `zod`
- Multiples app states at the same time

# Show me the code
```astro
---
import { Bind, BindForm, BButton, BInput } from "@astro-utils/forms/forms.js";
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
        <BInput type="text" name="name" maxlength={20} required/>
    
        <h4>Enter age*</h4>
        <BInput type="int" name="age" required/>
    
        <BButton onClick={formSubmit} whenFormOK>Submit</BButton>
    </BindForm>
</Layout>
```

## Usage

### Add the middleware to your server

```
npm install @astro-utils/forms
```

Add the middleware to your server


`src/middleware.ts`
```ts
import astroForms from "@astro-utils/forms";
import {sequence} from "astro/middleware";

export const onRequest = sequence(astroForms());
```

### Add to Layout
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

### Complex Form Validation

`pages/index.astro`
```astro
---
import { Bind, BindForm, FormErrors, BButton, BInput, BOption, BSelect, BTextarea } from "@astro-utils/forms/forms.js";
import Layout from "../layouts/Layout.astro";

type formType = {
    name: string,
    age: number,
    about?: string
    favoriteFood?: 'Pizaa' | 'Salad' | 'Lasagna'
}

const form = Bind<formType>();
let showSubmitText: string;

function formSubmit(){
    showSubmitText = `You name is ${form.name}, you are ${form.age} years old. `;

    if(form.about){
        showSubmitText += `\n\n${form.about}\n\n`;
    }

    if(form.favoriteFood){
        showSubmitText += `Your favorite food is ${form.favoriteFood}`;
    }
}
---
<Layout>
    <BindForm bind={form}>
        <FormErrors title="Form Errors"/>
    
        <h4>What you name*</h4>
        <BInput type={'text'} name="name" maxlength={20} required/>
    
        <h4>Enter age*</h4>
        <BInput type={'int'} name="age" required/>
    
        <h4>Tell about yourself</h4>
        <BTextarea name="about" maxlength={300}></BTextarea>
    
        <h4>What you favorite food?</h4>
        <BSelect name="favoriteFood" required={false}>
            <BOption disabled selected>Idk</BOption>
            <BOption>Pizaa</BOption>
            <BOption>Salad</BOption>
            <BOption>Lasagna</BOption>
        </BSelect>
    
        <BButton onClick={formSubmit} whenFormOK>Submit</BButton>
    
        {showSubmitText && <>
            <h3>You submitted the form:</h3>
            <div style="white-space: pre;">{showSubmitText}</div>
        </>}
    </BindForm>
</Layout>
```

### Button Hook

You can also use this as a simple on click hook

```astro
---
import { BButton } from "@astro-utils/forms/forms.js";
import { Button } from 'reactstrap';

const { session } = Astro.locals;

function increaseCounter() {
    session.counter ??= 0
    session.counter++
}
---
<Layout>
    <BButton as={Button} props={{color: 'info'}} onClick={increaseCounter}>++</BButton>
    {session.counter}
<Layout/>
```

The `session.counter` will show the **last value** and not the **update value**. 

This is because the output is **not reactive**. You can use it inside `BindForm` to make it **reactive**. 