import { AstroFormsError } from "./AstroFormsError.js";

export class MissingNamePropError extends AstroFormsError {
    constructor(public readonly componentName: string) {
        super(`Name prop is required for form components, missing in ${componentName}`);
    }
}