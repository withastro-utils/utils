import { BindForm } from "./form-utils/bind-form.js";
import ViewStateManager from "./form-utils/view-state.js";

export type BindContext = {
    executeAfter: (() => void | Promise<void>)[]
    method: string
    bind: BindForm<any>
    tempBindValues: Record<string, any>
    elementsState: Record<string, any>
    buttonIds: [string, string | null, boolean][],
    onSubmitClickGlobal: string
    settings: {
        showValidationErrors: boolean
    }
    bindId: string
    newState: boolean
    renderForm?: boolean
    viewState?: ViewStateManager
}