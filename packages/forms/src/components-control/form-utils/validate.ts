import {z} from 'zod';
import AboutFormName from '../form-utils/about-form-name.js';

function validateEmptyFile(about: AboutFormName) {
    const value = about.formValue;
    return value instanceof File && value.size == 0;
}

export function validateRequire(about: AboutFormName, required: boolean) {
    if (about.formValue == null || about.formValue === '' || validateEmptyFile(about)) {
        if (required) {
            about.pushErrorManually('missing-require-filed', 'Missing required filed');
        }
        return false;
    }

    return true;
}

export function validateStringPatters(about: AboutFormName, minlength: number, maxlength: number, pattern: RegExp) {
    let text = z.string();

    if (minlength) {
        text = text.min(minlength);
    }

    if (maxlength) {
        text = text.max(maxlength);
    }

    if (pattern) {
        text = text.regex(pattern);
    }

    return about.catchParse(text);
}

export async function validateFunc(about: AboutFormName, method: Function) {
    try {
        const response = await method(about.formValue);
        if (!response) return;

        if (response.error) {
            about.pushErrorManually(response.code, response.error);
        } else if (response.value) {
            about.formValue = response.value;
        }
    } catch (err) {
        about.pushErrorManually(err.code ?? err.name, err.message);
    }
}
