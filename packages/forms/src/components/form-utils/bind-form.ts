import { IHTMLFormPlugin } from "./bind-form-plugins/iform-plugin.js";
import HTMLInputRadioPlugin from "./bind-form-plugins/input-radio.js";
import HTMLSelectPlugin from "./bind-form-plugins/select.js";

const DEFAULT_PLUGINS = [HTMLInputRadioPlugin, HTMLSelectPlugin];
type PluginsNames = 'HTMLInputRadioPlugin' | 'HTMLSelectPlugin';

export class BindForm<T> {
    errors: {
        name: string,
        value: string,
        issues: {
            code: string,
            message: string
        }[],
        message: string
    }[] = [];
    private plugins: IHTMLFormPlugin[];

    constructor(private _defaults?: T) {
        this.defaults();
        this.initializePlugins();
    }

    private initializePlugins(){
        this.plugins = DEFAULT_PLUGINS.map(plugin => new plugin(this));
    }

    getPlugin(name: PluginsNames){
        return this.plugins.find(x => x.constructor.name == name);
    }

    finishFormValidation(){
        for(const plugin of this.plugins){
            plugin.createValidation();
        }
    }

    defaults(){
        this._defaults && Object.assign(this, this._defaults);
    }
}

export default function Bind<T>(defaults?: T): BindForm<T> & T & {[key: string]: any} {
    return <any>new BindForm(defaults);
}