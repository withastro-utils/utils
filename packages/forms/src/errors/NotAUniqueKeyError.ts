import { AstroFormsError } from "./AstroFormsError.js";

export class NotAUniqueKeyError extends AstroFormsError {
    constructor(public readonly key: string) {
        super(`The key prop in BindForm component is not unique (${key})`);
    }
}