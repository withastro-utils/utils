import type { AstroGlobal } from 'astro';
import { getFormValue } from '../form-tools/post.js';
import AboutFormName from './form-utils/about-form-name.js';
import type HTMLInputRadioPlugin from './form-utils/bind-form-plugins/input-radio.js';
import { BindForm } from './form-utils/bind-form.js';
import { parseCheckbox, parseColor, parseDate, parseEmail, parseFiles, parseNumber, parseURL } from './form-utils/parse.js';
import { validateFunc, validateRequire, validateStringPatters } from './form-utils/validate.js';

const OK_NOT_STRING_VALUE = ['checkbox', 'file'];
const OK_INPUT_VALUE_NULL = ['checkbox'];
const DAY_IN_MS = 86400000;

type InputTypes =
    | 'button'
    | 'checkbox'
    | 'color'
    | 'date'
    | 'datetime-local'
    | 'email'
    | 'file'
    | 'hidden'
    | 'image'
    | 'month'
    | 'number'
    | 'password'
    | 'radio'
    | 'range'
    | 'reset'
    | 'search'
    | 'submit'
    | 'tel'
    | 'text'
    | 'time'
    | 'url'
    | 'week';

type ExtendedInputTypes = InputTypes | 'int';

export async function getInputValue(astro: AstroGlobal) {
    const { value, name, readonly } = astro.props;
    if (readonly) {
        return value;
    }

    return await getFormValue(astro.request, name);
}

export async function validateFormInput(astro: AstroGlobal, bind: BindForm<any>) {
    const { type, value: originalValue, minlength, maxlength, pattern, required, name, errorMessage, validate } = astro.props;

    const parseValue: any = await getInputValue(astro);
    const aboutInput = new AboutFormName(bind, name, parseValue, errorMessage);

    // validate filed exits
    if (!OK_INPUT_VALUE_NULL.includes(type) && !validateRequire(aboutInput, required)) {
        return;
    }

    // validate string patters
    const checkStringPatterns = originalValue != null && !OK_NOT_STRING_VALUE.includes(type);
    if (checkStringPatterns && !validateStringPatters(aboutInput, minlength, maxlength, pattern)) {
        return;
    }

    // specific validation by type / function
    validateByInputType(astro, aboutInput, bind);
    if (!aboutInput.hadError && typeof validate == 'function') {
        await validateFunc(aboutInput, validate);
    }

    aboutInput.setValue();
}

function validateByInputType(astro: AstroGlobal, aboutInput: AboutFormName, bind: BindForm<any>) {
    const { type, min, max, value: originalValue, multiple, readonly } = astro.props;

    switch (type) {
        case 'checkbox':
            parseCheckbox(aboutInput, originalValue);
            break;

        case 'color':
            parseColor(aboutInput);
            break;

        case 'date':
        case 'datetime-local':
        case 'month':
        case 'week':
        case 'time':
            parseDate(aboutInput, type, min, max);
            break;

        case 'email':
            parseEmail(aboutInput);
            break;

        case 'number':
        case 'range':
        case 'int':
            parseNumber(aboutInput, type, min, max);
            break;

        case 'radio':
            const plugin = bind.getPlugin('HTMLInputRadioPlugin') as HTMLInputRadioPlugin;
            plugin.addNewValue(aboutInput, originalValue);
            break;

        case 'url':
            parseURL(aboutInput);
            break;

        case 'file':
            parseFiles(aboutInput, astro, multiple, readonly);
            break;
    }
}

function stringifyDate(date?: Date | string, type?: ExtendedInputTypes) {
    if (typeof date === 'string' || !date) {
        return date;
    }

    switch (type) {
        case 'date':
            return date.toISOString().slice(0, 10);
        case 'datetime-local':
            return date.toISOString().slice(0, 16);
        case 'time':
            return date.toTimeString().slice(0, 5);
        case 'month':
            return date.toISOString().slice(0, 7);
        case 'week':
            return formatToDateWeek(date);
    }

    return date;
}

export function inputReturnValueAttr(astro: AstroGlobal, bind: BindForm<any>) {
    const value = stringifyDate(bind[astro.props.name] ?? astro.props.value, astro.props.type);
    const min = stringifyDate(astro.props.min, astro.props.type);
    const max = stringifyDate(astro.props.max, astro.props.type);

    switch (astro.props.type as ExtendedInputTypes) {
        case 'checkbox':
            return { checked: value ?? astro.props.checked };
    }

    return { value, min, max };
}

function formatToDateWeek(date: Date): string {
    const year = date.getFullYear();
    const firstDayOfYear = new Date(year, 0, 1);
    const daysSinceStartOfYear = (date.getTime() - firstDayOfYear.getTime()) / DAY_IN_MS;
    const weekNumber = Math.ceil((daysSinceStartOfYear + firstDayOfYear.getDay() + 1) / 7);
    return `${year}-W${weekNumber.toString().padStart(2, '0')}`;
}


export function caseTypes(type: ExtendedInputTypes): { type: InputTypes; } & { [key: string]: string; } {
    if (type == 'int') {
        return {
            type: 'number',
            pattern: '\\d+',
            step: '1'
        };
    }

    return { type };
}
