import type { AstroGlobal } from 'astro';
import { z } from 'zod';
import { getFormMultiValue } from '../../form-tools/post.js';
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


type DateTypes = 'date' | 'datetime-local' | 'month' | 'week' | 'time';
export function parseDate(about: AboutFormName, type: DateTypes, min?: string, max?: string) {
    let date = z.date();

    if (min != null) {
        date = date.min(new Date(min));
    }

    if (max != null) {
        date = date.max(new Date(max));
    }

    if (type === 'date' || type === 'datetime-local') {
        about.formValue = new Date(about.formValue);
    } else if (type === 'time') {
        about.formValue = new Date(`1970-01-01T${about.formValue}:00`);
    } else if (type === 'month') {
        about.formValue = new Date(`${about.formValue}-01`);
    } else if (type === 'week') {
        const year = parseInt(about.formValue.substring(0, 4), 10);
        const week = parseInt(about.formValue.substring(6, 8), 10) - 1; // Subtract 1 to convert to 0-indexed
        const janFirst = new Date(year, 0, 1);
        const days = (week * 7) - janFirst.getDay() + 1;
        about.formValue = new Date(year, 0, days);
    }
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
