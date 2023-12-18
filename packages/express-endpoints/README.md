# Astro Express Endpoints

Let you use an express-like framework in astro endpoints, with builtin:

- Cookie parser
- Body parser
- Express middleware
- Body validation (via [`zod-express-middleware`](https://www.npmjs.com/package/expree))
- Session (When using [`@astro-utils/forms`](https://www.npmjs.com/package/@astro-utils/forms))

## Usage

```ts
const router = new ExpressRoute();

router.validate({
    body: z.object({
        name: z.string()
    })
});

export const POST = router.route(async (req, res) => {
    await new Promise(res => setTimeout(res, 1000));
    res.json({
        name: req.body.name,
        url: 'This is a POST request'
    });
});
```

When using the `validate` method it will be applied only to the next route.

Meaning that you can use the same router for multiple methods.

## Body parser

The default body-parser is `auto` meaning that it will parse the body no matter the type of it
including `multipart/form-data`.

You can configure the body parser by calling the `body` method.

```ts
const router = new ExpressRoute();

router.body('multipart');

export const POST = router.route((req, res) => {
    const myFile = req.filesOne.myFile;

    res.json({
        name: myFile?.name || 'No file',
    });
});
```

## Cookie parser

Use the default astro cookie parser for that
