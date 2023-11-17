# Astro Forms

<img src ="https://raw.githubusercontent.com/astro-utils/metro-forms/main/assets/logo.webp" width="100px"/><br/>


Reactive forms for Astro without any JavaScript!

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

### Complex Form Validation

`pages/index.astro`
```astro
---
import { BindForm, Button, FormErrors, Input, Option, Select, Textarea } from "@astro-utils/forms/forms.js";
import { Bind } from "@astro-utils/forms";
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
        <Input type={'text'} name="name" maxlength={20} required/>
    
        <h4>Enter age*</h4>
        <Input type={'int'} name="age" required/>
    
        <h4>Tell about yourself</h4>
        <Textarea name="about" maxlength={300}></Textarea>
    
        <h4>What you favorite food?</h4>
        <Select name="favoriteFood" required={false}>
            <Option disabled selected>Idk</Option>
            <Option>Pizaa</Option>
            <Option>Salad</Option>
            <Option>Lasagna</Option>
        </Select>
    
        <Button onClick={formSubmit} whenFormOK>Submit</Button>
    
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
import { Button } from "@astro-utils/forms/forms.js";
const { asSession } = Astro.locals

function increaseCounter() {
    asSession.counter ??= 0
    asSession.counter++
}
---
<Layout>
    <Button onClick={increaseCounter}>++</Button>
    {asSession.counter}
<Layout/>
```

The changing data need to be after the button.

If you want to before the button use it inside `BindForm`
