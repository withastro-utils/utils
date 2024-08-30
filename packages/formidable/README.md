# Astro Formidable

Allow you to use formidable for request parse.


>  If parsing form data does not work with the default `Astro.request.formData()`.

## Usage

`pages/upload.json.ts`
```ts
import {parseAstroForm, isFormidableFile} from '@astro-utils/formidable';
import fs from 'fs/promises';

export const post: APIRoute = async ({request}) => {
    const formData: FormData = await parseAstroForm(Astro.request);
    let name = 'Not-File'

    const file = formData.getFile('file');
    if(isFormidableFile(file)){
        const content = await fs.readFile(file.filepath);
        name = file.originalFilename + ' - ' + content.length;
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

    const file = formData.getFile('my-file');
    if(isFormidableFile(file)){
        console.log('The user upload a file');
    }
}
---
```
