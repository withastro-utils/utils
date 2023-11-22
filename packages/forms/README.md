<div align="center">

# Astro Forms

<img src="https://raw.githubusercontent.com/withastro-utils/utils/main/assets/logo.rounded.png" alt="Astro Utils" height="300px"/>


[![Build](https://github.com/withastro-utils/utils/actions/workflows/release.yml/badge.svg)](https://github.com/withastro-utils/utils/actions/workflows/build.yml)
[![License](https://badgen.net/badge/color/MIT/green?label=license)](https://www.npmjs.com/package/@astro-utils/forms)
[![License](https://badgen.net/badge/color/TypeScript/blue?label=types)](https://www.npmjs.com/package/@astro-utils/forms)
[![Version](https://badgen.net/npm/v/@astro-utils/forms)](https://www.npmjs.com/package/@astro-utils/forms)
</div>


> Reactive forms for Astro without any JavaScript!

### Why use this?
- Allow client side & server side validation & parsing (number, boolean...)
- CSRF protection (with JWT)
- Export JWT session that can be used in every page.
- Use formidable to parse forms data


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

The changing data need to be after the button.

If you want to before the button use it inside `BindForm`
