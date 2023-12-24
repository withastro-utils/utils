import type {AstroGlobal} from 'astro';
import {z} from 'zod';
import {getFormMultiValue} from '../../form-tools/post.js';
import AboutFormName from './about-form-name.js';

const HEX_COLOR_REGEX = /^#?([0-9a-f]{6}|[0-9a-f]{3})$/i;

export function parseCheckbox(about: AboutFormName, originalValue?: string) {
    if (originalValue == null) {
        about.formValue = about.formValue === 'on';
    }
}

export function parseNumber(about: AboutFormName, type: 'number' | 'int' | 'range', min?: number, max?: number) {
    let num = z.number();

    if (type === 'int') {
        num = num.int();
    }

    if (min != null) {
        num = num.min(min);
    }

    if (max != null) {
        num = num.max(max);
    }

    about.formValue = Number(about.formValue);
    about.catchParse(num);
}

export function parseDate(about: AboutFormName, min?: string, max?: string) {
    let date = z.date();

    if (min != null) {
        date = date.min(new Date(min));
    }

    if (max != null) {
        date = date.max(new Date(max));
    }

    about.formValue = new Date(about.formValue);
    about.catchParse(date);
}

export function parseEmail(about: AboutFormName) {
    about.catchParse(z.string().email());
}

export function parseURL(about: AboutFormName) {
    about.catchParse(z.string().url());
}

export function parseColor(about: AboutFormName) {
    about.catchParse(z.string().regex(HEX_COLOR_REGEX), 'Invalid hex color');
}

export async function parseFiles(about: AboutFormName, astro: AstroGlobal, multiple: boolean, readonly: boolean) {
    let values = [about.formValue];
    if (multiple && !readonly) {
        values = about.formValue = await getFormMultiValue(astro.request, about.originalName);
    }

    for (const value of values) {
        if (!(value instanceof File)) {
            about.pushErrorManually('upload-not-file', 'The upload value is not a file');
            break;
        }
    }
}
