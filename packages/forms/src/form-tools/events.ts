export function addOnSubmitClickEvent(buttonId?: string | false, allProps?: {[key: string]: string}){
    if(buttonId){
        allProps.onkeypress = `__CSEvent(event, '${buttonId}');${allProps.onkeypress ?? ''}`;
    }
}