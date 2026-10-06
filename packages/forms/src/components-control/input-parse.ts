import type { AstroGlobalLike } from '../utils.js';
import { getFormValue } from '../form-tools/post.js';
import AboutFormName from './form-utils/about-form-name.js';
import type HTMLInputRadioPlugin from './form-utils/bind-form-plugins/input-radio.js';
import { BindForm } from './form-utils/bind-form.js';
import { DEFAULT_DATE_AS_MILLISECONDS, parseCheckbox, parseColor, parseDate, parseEmail, parseEmptyFiles, parseFiles, parseJSON, parseNumber, parseTimeFormat, parseURL } from './form-utils/parse.js';
import { validateFunc, validateRequire, validateStringPatters } from './form-utils/validate.js';
import { getProperty } from 'dot-prop';
import { ZodType } from 'zod';

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

type ExtendedInputTypes = InputTypes | 'int' | 'json';

export async function getInputValue(astro: AstroGlobalLike, bindId: string, bind: BindForm<any>) {
    const { value, name, readonly } = astro.props;
    if (readonly) {
        return getProperty(bind, name, value);
    }

    return await getFormValue(astro.request, bindId + name);
}

export async function validateFormInput(astro: AstroGlobalLike, bind: BindForm<any>, bindId: string) {
    const { type, value: originalValue, minlength, maxlength, pattern, required, name, errorMessage, validate } = astro.props;

    const parseValue: any = await getInputValue(astro, bindId, bind);
    const aboutInput = new AboutFormName(bind, name, parseValue, errorMessage);

    // validate filed exits
    if (!OK_INPUT_VALUE_NULL.includes(type) && !validateRequire(aboutInput, required)) {
        if (type === 'file') {
            parseEmptyFiles(aboutInput, astro);
        }
        aboutInput.setValue();
        return;
    }

    // validate string patters
    const checkStringPatterns = originalValue != null && !OK_NOT_STRING_VALUE.includes(type);
    if (checkStringPatterns && !validateStringPatters(aboutInput, minlength, maxlength, pattern)) {
        return;
    }

    // specific validation by type / function
    let setValue = await validateByInputType(astro, aboutInput, bind);
    if (!aboutInput.hadError) {
        if (typeof validate == 'function') {
            await validateFunc(aboutInput, validate);
        } else if (validate instanceof ZodType) {
            aboutInput.catchParse(validate);
        }
    }

    if(setValue){
        aboutInput.setValue();
    }
}

async function validateByInputType(astro: AstroGlobalLike, aboutInput: AboutFormName, bind: BindForm<any>) {
    const { type, min, max, value: originalValue, parseTimeFormat: timeFormat, multiple, readonly } = astro.props;

    let setValue = true;
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

            if(type === 'time'){
                parseTimeFormat(aboutInput, timeFormat);
            }
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
            setValue = false;
            break;

        case 'url':
            parseURL(aboutInput);
            break;

        case 'json':
            parseJSON(aboutInput);
            break;

        case 'file':
            await parseFiles(aboutInput, astro, multiple, readonly);
            break;
    }

    return setValue;
}

function stringifyCustomValue(date?: Date | string, dateStep?: string, type?: ExtendedInputTypes) {
    if (typeof date === 'string' || date == null) {
        return date;
    }

    switch (type) {
        case 'date':
            return toLocalDate(date);
        case 'month':
            return toLocalDate(date).slice(0, 7);
        case 'week':
            return formatToDateWeek(date);
        case 'datetime-local':
            return `${ toLocalDate(date) }T${ formatTime(date, dateStep) }`;
        case 'time':
            return formatTime(date, dateStep)
        case 'json':
            return JSON.stringify(date);
    }

    return date;
}

function getStepDecimals(step: number) {
    for (let decimals = 0; decimals <= 3; decimals++) {
        if (Number.isInteger(step * 10 ** decimals)) return decimals;
    }

    return 3;
}

function formatTime(time: Date | number, dateStep: string = '') {
    const step = parseFloat(dateStep);

    if(typeof time === 'number'){
        time = new Date(DEFAULT_DATE_AS_MILLISECONDS + time);
    }

    const hours = String(time.getHours()).padStart(2, '0');
    const minutes = String(time.getMinutes()).padStart(2, '0');

    let formattedTime = `${ hours }:${ minutes }`;

    if (step < 60) {
        formattedTime += ':' + String(time.getSeconds()).padStart(2, '0');

        if (step < 1) {
            const decimals = getStepDecimals(step);
            const milliseconds = String(time.getMilliseconds()).padStart(3, '0');

            formattedTime += '.' + milliseconds.slice(0, decimals);
        }
    }

    return formattedTime;
}

function toLocalDate(date: Date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are zero-based
    const day = String(date.getDate()).padStart(2, '0');

    return `${ year }-${ month }-${ day }`;
}

function formatToDateWeek(date: Date): string {
    const year = date.getFullYear();
    const firstDayOfYear = new Date(year, 0, 1);
    const daysSinceStartOfYear = (date.getTime() - firstDayOfYear.getTime()) / DAY_IN_MS;
    const weekNumber = Math.ceil((daysSinceStartOfYear + firstDayOfYear.getDay() + 1) / 7);
    return `${ year }-W${ weekNumber.toString().padStart(2, '0') }`;
}

export function inputReturnValueAttr(astro: AstroGlobalLike, bind: BindForm<any>) {
    const value = stringifyCustomValue(getProperty(bind, astro.props.name, astro.props.value), astro.props.step, astro.props.type);
    const min = stringifyCustomValue(astro.props.min, astro.props.step, astro.props.type);
    const max = stringifyCustomValue(astro.props.max, astro.props.step, astro.props.type);

    switch (astro.props.type as ExtendedInputTypes) {
        case 'checkbox':
            return { checked: value ?? astro.props.checked };
        case 'file':
            return {};
    }

    return { value, min, max };
}


export function caseTypes(type: ExtendedInputTypes): { type: ExtendedInputTypes; } & { [key: string]: string; } {
    if (type == 'int') {
        return {
            type: 'number',
            pattern: '\\d+',
            step: '1'
        };
    } else if (type == 'json') {
        return {
            type: 'text'
        };
    }

    return { type };
}
