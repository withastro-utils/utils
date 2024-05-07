import type { AstroGlobal } from 'astro';
import { getFormMultiValue } from '../form-tools/post.js';
import AboutFormName from './form-utils/about-form-name.js';
import HTMLSelectPlugin from './form-utils/bind-form-plugins/select.js';
import { BindForm } from './form-utils/bind-form.js';
import { parseMultiDate, parseMultiNumber } from './form-utils/parse-multi.js';
import { validateRequire } from './form-utils/validate.js';
import { getProperty } from 'dot-prop';

type InputTypes = 'number' | 'date' | 'text';


export function stringifySelectValue(value: Date | Number | string) {
    if (value instanceof Date) {
        value = value.getTime();
    }
    return String(value);
}

async function getSelectValue(astro: AstroGlobal, bindCounter: string) {
    const { value: originalValue, readonly, name } = astro.props;
    if (readonly) {
        return [originalValue].flat().map(stringifySelectValue);
    }
    return (await getFormMultiValue(astro.request, bindCounter + name)).map(String);
}

export async function validateSelect(astro: AstroGlobal, bind: BindForm<any>, bindCounter: string) {
    const { type, required, name, multiple, errorMessage } = astro.props;

    const parseValue = await getSelectValue(astro, bindCounter);
    const aboutSelect = new AboutFormName(bind, name, parseValue, errorMessage);

    if (!validateRequire(aboutSelect, required)) {
        aboutSelect.setValue();
        return [];
    }

    const selectPlugin = bind.getPlugin('HTMLSelectPlugin') as HTMLSelectPlugin;
    selectPlugin.addNewValue(aboutSelect, parseValue, multiple, required);

    switch (type as InputTypes) {
        case 'date':
            parseMultiDate(aboutSelect);
            break;

        case 'number':
            parseMultiNumber(aboutSelect);
            break;
    }

    aboutSelect.setValue();

    return parseValue;
}

export function validateSelectOption(bind: BindForm<any>, name: string, stringifyValue: string) {
    const selectPlugin = bind.getPlugin('HTMLSelectPlugin') as HTMLSelectPlugin;
    selectPlugin.addOption(name, stringifyValue);
}


export function getSelectValueFromBind(bind: BindForm<any>, astro: AstroGlobal) {
    const newValue = [getProperty(bind, astro.props.name, astro.props.value)].flat();

    return newValue.map(stringifySelectValue);
}