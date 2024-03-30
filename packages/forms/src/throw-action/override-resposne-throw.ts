import ThrowAction from "./throw-action.js";

export default class ThrowOverrideResponse extends ThrowAction {
    public response?: Response | null;
    /**
     * Override the response with a new one.
     * 
     * If no `Response` is provided, will be use the response stored in `locals.forms.overrideResponse`.
     * 
     * If no `Response` is stored in `locals.forms.overrideResponse`, will be return the message with error code 500.
     * @param response - The new response to return.
     * @param message - The error message to show (if no response is provided / error catch).
     */
    constructor(response?: Response | null, message = 'An error occurred, please try again later.') {
        super(message);
        this.response = response;
    }
}