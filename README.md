<div align="center">

<img src="./assets/logo.svg" alt="Astro Utils rocket and toolkit logo" width="112" height="112" />

# Astro Utils

**Your form. Your server. One place.**

[![Release](https://github.com/withastro-utils/utils/actions/workflows/release.yml/badge.svg)](https://github.com/withastro-utils/utils/actions/workflows/release.yml)
[![MIT license](https://img.shields.io/badge/license-MIT-82cfff?style=flat-square)](https://github.com/withastro-utils/utils/blob/main/LICENSE)
[![Documentation](https://img.shields.io/badge/docs-explore-0b6ead?style=flat-square)](https://withastro-utils.github.io/docs/)

[Documentation](https://withastro-utils.github.io/docs/) · [Examples](https://withastro-utils.github.io/docs/examples/) · [AI agent guide](https://withastro-utils.github.io/docs/llms.txt)

</div>

Small, focused utilities for Astro: bind form fields to server actions, share values through a component tree, and build HTTP endpoints with familiar middleware.

## Pick what you need

| Package | What you can build | Start here |
| --- | --- | --- |
| [`@astro-utils/forms`](./packages/forms/) | Validated forms, server actions, persistent form state, and uploads | [Forms guide](https://withastro-utils.github.io/docs/guides/forms/getting-started/) |
| [`@astro-utils/context`](./packages/context/) | Shared request-local values without passing props through every component | [Context guide](https://withastro-utils.github.io/docs/guides/context/) |
| [`@astro-utils/express-endpoints`](./packages/express-endpoints/) | API routes with middleware, body parsing, and response helpers | [Endpoints guide](https://withastro-utils.github.io/docs/guides/express-endpoints/) |

The workspace also contains a supporting [Formidable utility package](./packages/formidable/).

## A server action, right in your page

After the [Forms setup](https://withastro-utils.github.io/docs/guides/forms/getting-started/), save this as **`src/pages/hello.astro`**. The shared layout supplies `WebForms`.

```astro
---
import { Bind, BindForm, BInput, BButton, FormErrors } from '@astro-utils/forms/forms.js';
import Layout from '../layouts/Layout.astro';

const bind = Bind({ name: '' });
let message = '';

function greet() {
    message = `Hello, ${bind.name}!`;
}
---
<Layout>
    <BindForm {bind}>
        <FormErrors />

        <label for="name">Your name</label>
        <BInput id="name" name="name" maxlength={40} required />

        <BButton onClick={greet} whenFormOK>Say hello</BButton>
        {message && <p role="status">{message}</p>}
    </BindForm>
</Layout>
```

The field binds to `name`, validation guards the callback, and Astro renders the greeting. Forms supports Astro 7, including nested components and controls rendered in loops.

## Explore a working pattern

[Product filtering](https://withastro-utils.github.io/docs/examples/products/) · [Task lists](https://withastro-utils.github.io/docs/examples/todo/) · [File uploads](https://withastro-utils.github.io/docs/examples/upload/)

For coding agents: [Markdown index](https://withastro-utils.github.io/docs/llms.txt) · [Complete documentation](https://withastro-utils.github.io/docs/llms-full.txt).

## Local development

From the repository root:

```sh
npm install
npm --workspace examples/simple-form run build
```

## Support Astro Utils

If Astro Utils helps you build, a star on [GitHub](https://github.com/withastro-utils/utils) is appreciated. Bug reports, useful examples, and pull requests help too. Thank you for supporting the project.

[MIT license](https://github.com/withastro-utils/utils/blob/main/LICENSE)
