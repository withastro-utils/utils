# Astro Forms

Full feature form control for Astro.js

Allow client side & server side validation and CSRF protection. Alow export a session the you can use in your pages

## Usage

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
import { activateWebForms,Bind } from "@astro-metro/forms";
import { BindForm,Button,Input } from "@astro-metro/forms/forms.js";
import Layout from "../layouts/Layout.astro";
await activateWebForms(Astro);

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

### Complex Form Validation

`pages/index.astro`
```astro
---
import { BindForm, Button, FormErrors, Input, Option, Select, Textarea } from "@astro-metro/forms/forms.js";
import {Bind, activateWebForms} from "@astro-metro/forms";
import Layout from "../layouts/Layout.astro";
await activateWebForms(Astro);

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
import { activateWebForms } from "@astro-metro/forms";
import { Button } from "@astro-metro/forms/forms.js";
const {session} = await activateWebForms(Astro);

function increaseCounter() {
    session.counter ??= 0
    session.counter++
}
---
<Layout>
    <Button onClick={increaseCounter}>++</Button>
<Layout/>

{session.counter}
```

The changing data need to be after the button.

If you want to before the button use it inside `BindForm`