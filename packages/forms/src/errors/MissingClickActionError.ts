import { AstroFormsError } from "./AstroFormsError.js";

export class MissingClickActionError extends AstroFormsError {
    constructor() {
        super(`The click action is missing in the \`BButton\` component`);
    }
}