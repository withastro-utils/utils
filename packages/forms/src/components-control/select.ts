import type {AstroGlobal} from 'astro';
import {getFormMultiValue} from '../form-tools/post.js';
import AboutFormName from './form-utils/about-form-name.js';
import HTMLSelectPlugin from './form-utils/bind-form-plugins/select.js';
import {BindForm} from './form-utils/bind-form.js';
import {parseMultiDate, parseMultiNumber} from './form-utils/parse-multi.js';
import {validateRequire} from './form-utils/validate.js';

type InputTypes = 'number' | 'date' | 'text'

export async function getSelectValue(astro: AstroGlobal) {
    const {value: originalValue, readonly, name} = astro.props;
    if(readonly){
        return [originalValue].flat();
    }
    return await getFormMultiValue(astro.request, name);
}

export async function validateSelect(astro: AstroGlobal, bind: BindForm<any>) {
    const {type, required, name, multiple, errorMessage} = astro.props;

    const parseValue: any = await getSelectValue(astro);
    const aboutSelect = new AboutFormName(bind, name, parseValue, errorMessage);

    if (!validateRequire(aboutSelect, required)) {
        return;
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
}

export function validateSelectOption(astro: AstroGlobal, bind: BindForm<any>, name: string, slotValue: string) {
    const {value, disabled} = astro.props;
    if (disabled) return;

    const realValue = value ?? slotValue;
    const selectPlugin = bind.getPlugin('HTMLSelectPlugin') as HTMLSelectPlugin;
    selectPlugin.addOption(name, realValue);
}
