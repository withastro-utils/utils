import { AstroFormsError } from "./AstroFormsError.js";

export class MissingKeyPropError extends AstroFormsError {
    constructor() {
        super(`Missing \`key\` prop in BindForm component`);
    }
}