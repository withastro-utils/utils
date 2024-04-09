import { setProperty } from 'dot-prop';
import type AboutFormName from '../about-form-name.js';
import {IHTMLFormPlugin} from './iform-plugin.js';

type SelectObject = {
    about: AboutFormName
    value: string | string[],
    options: Set<string>,
    multiOptions: boolean
    required: boolean
}

type SelectValidation = Map<string, SelectObject>

export default class HTMLSelectPlugin extends IHTMLFormPlugin {
    storage: SelectValidation = new Map();

    static errorOptionNotValid(about: AboutFormName) {
        about.pushErrorManually('option-not-valid', 'Select option not valid');
    }

    createOneValidation(name: string, keyData: any): void {
        const {options, multiOptions, value, about, required}: SelectObject = keyData;

        if (multiOptions) {
            const arrayValue = Array.isArray(value) ? value : [value];

            if (!arrayValue.every(x => options.has(x))) {
                required && HTMLSelectPlugin.errorOptionNotValid(about);
                return;
            }

            setProperty(this.form, name, about.formValue); // the parsed values
            return;
        }

        if (!options.has(<string>value[0])) {
            required && HTMLSelectPlugin.errorOptionNotValid(about);
            return;
        }

        setProperty(this.form, name, about.formValue[0]); // the parsed value
    }

    private createSelectDefault(about: AboutFormName, value: string | string[], multiOptions: boolean, required: boolean): SelectObject {
        return {
            about,
            options: new Set<string>(),
            value,
            multiOptions,
            required
        };
    }

    addNewValue(about: AboutFormName, value: string | string[], multiOptions: boolean, required = true): void {
        if (!this.storage.has(about.originalName)) {
            this.storage.set(about.originalName, this.createSelectDefault(about, value, multiOptions, required));
        }
    }

    addOption(originalName: string, option: string) {
        this.storage.get(originalName)?.options.add(option);
    }
}
