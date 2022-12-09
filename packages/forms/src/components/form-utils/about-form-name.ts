import { ZodError, ZodFirstPartySchemaTypes } from "zod";
import { BindForm } from "./bind-form.js";

export default class AboutFormName {
    hadError = false;

    constructor(public form: BindForm<any>, public originalName: string, public formValue?: any,  public errorMessage?: string){

    }

    pushError(zodError: ZodError, overrideMessage?: string){
        this.hadError = true;
        const topMessage = overrideMessage ?? zodError.issues.at(0).message;

        this.form.errors.push({
            name: this.originalName,
            value: this.formValue,
            message: this.errorMessage ?? topMessage,
            issues: zodError.issues.map(x => ({code: x.code, message: x.message}))
        });
    }

    pushErrorManually(code: string, errorMessage: string){
        this.hadError = true;
        this.form.errors.push({
            name: this.originalName,
            value: this.formValue,
            message: this.errorMessage ?? errorMessage,
            issues: [{code, message: errorMessage}]
        });
    }

    catchParse(zObject: ZodFirstPartySchemaTypes, overrideMessage?: string){
        try {
            this.formValue = zObject.parse(this.formValue);
            return true;
        } catch (err){
            this.pushError(err, overrideMessage);
        }
    }

    setValue(){
        if(this.hadError) return;
        this.form[this.originalName] = this.formValue;
    }
}