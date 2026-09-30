<div align="center">

<img src="https://raw.githubusercontent.com/withastro-utils/utils/main/assets/logo.svg" alt="Astro Utils rocket and toolkit logo" width="112" height="112" />

# Astro Utils Forms

**Bind inputs. Validate data. Run server actions.**

[![npm version](https://img.shields.io/npm/v/@astro-utils/forms?color=0b6ead&style=flat-square)](https://www.npmjs.com/package/@astro-utils/forms)
[![MIT license](https://img.shields.io/badge/license-MIT-82cfff?style=flat-square)](https://github.com/withastro-utils/utils/blob/main/LICENSE)
[![Documentation](https://img.shields.io/badge/docs-explore-0b6ead?style=flat-square)](https://withastro-utils.github.io/docs/)

[Documentation](https://withastro-utils.github.io/docs/) · [Examples](https://withastro-utils.github.io/docs/examples/) · [AI agent guide](https://withastro-utils.github.io/docs/llms.txt)

</div>

Build interactive forms in `.astro` components with typed binding, browser and server validation, encrypted view state, signed sessions, and chunked uploads.

## Install

```sh
npm install @astro-utils/forms @astrojs/node
```

## Connect Forms to Astro

**`astro.config.mjs`**

```js
import { defineConfig } from 'astro/config';
import node from '@astrojs/node';
import forms from '@astro-utils/forms/dist/integration.js';

export default defineConfig({
    output: 'server',
    adapter: node({ mode: 'standalone' }),
    integrations: [forms]
});
```

**`src/middleware.ts`**

```ts
import forms from '@astro-utils/forms';
export const onRequest = forms();
```

These defaults are for local development. Configure a stable environment secret before deploying; see [configuration](https://withastro-utils.github.io/docs/reference/forms/configuration/). Use Astro's `sequence()` when combining middleware.

**`src/layouts/Layout.astro`**

```astro
---
import { WebForms } from '@astro-utils/forms/forms.js';
---

<WebForms>
    <slot />
</WebForms>
```

## First form

```astro
---
import { BButton, BInput, BOption, BSelect, BTextarea, Bind, BindForm, FormErrors } from '@astro-utils/forms/forms.js';

type ProfileForm = {
    name: string;
    age: number;
    about?: string;
    favoriteFood?: 'Pizza' | 'Salad' | 'Lasagna';
};

const form = Bind<ProfileForm>();
let result = '';

function submit() {
    result = `${form.name} is ${form.age} years old.`;
}
---

<BindForm bind={form}>
    <FormErrors title="Check the form" />

    <label for="name">Name</label>
    <BInput id="name" name="name" maxlength={20} required />

    <label for="age">Age</label>
    <BInput id="age" name="age" type="int" min={1} required />

    <label for="about">About you</label>
    <BTextarea id="about" name="about" maxlength={300} />

    <label for="food">Favorite food</label>
    <BSelect id="food" name="favoriteFood" required={false}>
        <BOption disabled selected>Choose a food</BOption>
        <BOption>Pizza</BOption>
        <BOption>Salad</BOption>
        <BOption>Lasagna</BOption>
    </BSelect>

    <BButton onClick={submit} whenFormOK>Submit</BButton>
    {result && <p>{result}</p>}
</BindForm>
```

`whenFormOK` prevents the callback from running when validation fails. `FormErrors` renders the server validation messages for the active form.

## Lists and reusable components

Generated identities distinguish controls rendered from the same source location. No index parameter is required:

```astro
<BindForm>
    {items.map(item => (
        <BButton onClick={removeItem} extra={item.id}>
            Remove {item.name}
        </BButton>
    ))}
</BindForm>
```

## Go further

- [Binding and validation](https://withastro-utils.github.io/docs/guides/forms/data-binding/): typed values, validation, and state.
- [Lists and reusable components](https://withastro-utils.github.io/docs/guides/forms/loops-and-components/): independent forms and actions in repeated UI.
- [Large-file uploads](https://withastro-utils.github.io/docs/reference/forms/upload-big-file/): chunks, progress, and failure handling.
- [Server helpers](https://withastro-utils.github.io/docs/guides/forms/js-helpers/): redirects, response overrides, and parent refreshes.

View state and sessions serve different purposes. Sessions are signed, not encrypted; use application storage for durable data. Keep passwords out of persisted view state.

## Support Astro Utils

If Astro Utils helps you build, a star on [GitHub](https://github.com/withastro-utils/utils) is appreciated. Bug reports, useful examples, and pull requests help too. Thank you for supporting the project.

[MIT license](https://github.com/withastro-utils/utils/blob/main/LICENSE)
