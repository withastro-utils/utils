# Astro Formidable

Allow you to use formidable for request parse

## Usage

`pages/upload.json.ts`
```ts
import {parseAstroForm, isFormidableFile} from '@astro-utils/formidable';

export const post: APIRoute = async ({request}) => {
    const formData: FormData = await parseAstroForm(Astro.request);
    let name = 'Not-File'

    const file = formData.get('file');
    if(isFormidableFile(file)){
        name = file.name;
    }

    return {
        body: name
    }
}
```

`pages/index.page`
```astro
---
import {parseAstroForm, isFormidableFile} from '@astro-utils/formidable';

if(Astro.request.method === "POST"){
    const formData: FormData = await parseAstroForm(Astro.request);

    const file = formData.get('my-file');
    if(isFormidableFile(file)){
        console.log('The user upload a file');
    }
}
---
```
