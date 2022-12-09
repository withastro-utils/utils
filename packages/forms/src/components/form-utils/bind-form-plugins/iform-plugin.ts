import type { BindForm } from "../bind-form.js";
import AboutFormName from "../about-form-name.js";

export abstract class IHTMLFormPlugin {
    storage: Map<string, any> = new Map();

    constructor(protected form: BindForm<any>){

    }

    abstract createOneValidation(key: string, value: any): void;
    abstract addNewValue(about: AboutFormName, ...any: any[]): void;

    createValidation(){
        for(const [key, value] of this.storage){
            this.createOneValidation(key, value);
            this.storage.delete(key);
        }
    }
}