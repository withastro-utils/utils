<div align="center">

<img src="https://raw.githubusercontent.com/withastro-utils/utils/main/assets/logo.svg" alt="Astro Utils rocket and toolkit logo" width="112" height="112" />

# Astro Utils Express Endpoints

**Familiar middleware. Native Astro routes.**

[![npm version](https://img.shields.io/npm/v/@astro-utils/express-endpoints?color=0b6ead&style=flat-square)](https://www.npmjs.com/package/@astro-utils/express-endpoints)
[![MIT license](https://img.shields.io/badge/license-MIT-82cfff?style=flat-square)](https://github.com/withastro-utils/utils/blob/main/LICENSE)
[![Documentation](https://img.shields.io/badge/docs-explore-0b6ead?style=flat-square)](https://withastro-utils.github.io/docs/)

[Documentation](https://withastro-utils.github.io/docs/) · [Examples](https://withastro-utils.github.io/docs/examples/) · [AI agent guide](https://withastro-utils.github.io/docs/llms.txt)

</div>

Compose middleware, read parsed request data, and return JSON, redirects, files, or streams from Astro endpoints. An Express-style API for Astro—not a drop-in replacement for every Express application.

## Install

```sh
npm install @astro-utils/express-endpoints zod@^3
```

## Validate a JSON request

**`src/pages/api/greet.ts`**

```ts
import { ExpressRoute } from '@astro-utils/express-endpoints';
import { z } from 'zod';

const router = new ExpressRoute();

router.use((_req, res, next) => {
    res.set('Cache-Control', 'no-store');
    next();
});

router.validate({
    body: z.object({
        name: z.string().trim().min(1, 'A name is required.'),
    }),
});

export const POST = router.route((req, res) => {
    res.json({ message: `Hello, ${req.body.name.trim()}!` });
});
```

Send a JSON body such as `{"name":"Alex"}` with `Content-Type: application/json` to `/api/greet`. The route returns `{"message":"Hello, Alex!"}`; missing, non-string, or blank names receive a 400 response with validation errors before the handler runs.

`validate()` checks the body without transforming it, so the handler trims the name when using it. This example uses Zod 3, as required by the validation middleware.

## A small routing toolbox

| Method | Purpose |
| --- | --- |
| `use(middleware)` | Add middleware. Call `next()` to continue, or send a response to stop. |
| `body(type)` | Select `auto`, `json`, `multipart`, `urlencoded`, or `text` parsing. |
| `validate(schemas)` | Add schema validation for the next registered route. |
| `route(...handlers)` | Create an Astro endpoint handler. |

Read parsed cookies through `req.cookies`; use `res.cookie()` to set response cookies. Forms-backed sessions are available when your application also installs and configures Forms middleware.

[Getting started](https://withastro-utils.github.io/docs/guides/express-endpoints/) · [Request API](https://withastro-utils.github.io/docs/reference/express/request/) · [Response API](https://withastro-utils.github.io/docs/reference/express/response/) · [Router and errors](https://withastro-utils.github.io/docs/reference/express/router-and-errors/)

## Support Astro Utils

If Astro Utils helps you build, a star on [GitHub](https://github.com/withastro-utils/utils) is appreciated. Bug reports, useful examples, and pull requests help too. Thank you for supporting the project.

[MIT license](https://github.com/withastro-utils/utils/blob/main/LICENSE)
