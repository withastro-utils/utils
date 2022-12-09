import AboutFormName from "../about-form-name.js";
import { IHTMLFormPlugin } from "./iform-plugin.js"

type RadioItem = {
    about: AboutFormName,
    options: Set<string>
}
type RadioValidation = Map<string, RadioItem>

export default class HTMLInputRadioPlugin extends IHTMLFormPlugin {
    storage: RadioValidation = new Map();

    createOneValidation(name: string, keyData: any): void {
        const {options, about}: RadioItem = keyData;

        if(!options.has(about.formValue)){
            about.pushErrorManually('radio-invalid-value', 'Radio value invalid');
            return;
        }

        this.form[name] = about.formValue;
    }

    private createRadioDefault(about: AboutFormName): RadioItem {
        return {
            about, 
            options: new Set<string>()
        }
    }

    addNewValue(about: AboutFormName, originalValue: string): void {
        if(!this.storage.has(about.originalName)){
            this.storage.set(about.originalName, this.createRadioDefault(about));
        } else {
            this.storage.get(about.originalName).options.add(originalValue);
        }
    }
}