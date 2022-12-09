import formidable from "formidable";
import PersistentFile from "formidable/src/PersistentFile.js";
import { EventEmitter } from "node:events";
import ExtendedFormData from "./ExtendedFormData.js";

class FormidableRequest extends EventEmitter {
    headers: { [key: string]: string }

    constructor(request: Request) {
        super();
        this.headers = Object.fromEntries(request.headers.entries());
    }

    pause() { }

    resume() { }
}

/**
 * Parse form data - urlencoded, multipart and all other plugins of formidable,
 * you can specify witch plugins to use in the options
 * @param request 
 * @param options 
 * @returns 
 */
export default async function parseAstroForm(request: Request, options?: formidable.Options) {
    const formData = new ExtendedFormData();
    const form = formidable(options);

    const formidableRequest = new FormidableRequest(request);
    const dataFinish = new Promise((res: any) => {
        form.parse(<any>formidableRequest, (err, fields, files) => {
            if (err) return res();

            for (const [key, values] of Object.entries(fields)) {
                for (const value of values) {
                    formData.append(key, value);
                }
            }

            for (const [key, values] of Object.entries(files)) {
                for (const value of <any>values) {
                    formData.append(key, value);
                }
            }

            res();
        });
    })


    const bodyData = await request.arrayBuffer();
    const sizeLimit = (options?.maxFieldsSize ?? 0) + (options?.maxTotalFileSize ?? 0);
    if(!sizeLimit || sizeLimit >= bodyData.byteLength){
        formidableRequest.emit('data', new Uint8Array(bodyData));
    }
    
    formidableRequest.emit('end');
    await dataFinish;

    return formData;
}

export function isFormidableFile(object: any) {
    return object instanceof PersistentFile;
}