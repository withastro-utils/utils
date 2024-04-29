export function addOnSubmitClickEvent(buttonId?: string | false, allProps?: {[key: string]: string}){
    if(buttonId){
        allProps["data-submit"] = buttonId;
        allProps.onkeypress = `__enterToSubmit(event)${allProps.onkeypress ? ';' + allProps.onkeypress : ''}`;
    }
}