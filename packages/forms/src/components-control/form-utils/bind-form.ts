import { IHTMLFormPlugin } from './bind-form-plugins/iform-plugin.js';
import HTMLInputRadioPlugin from './bind-form-plugins/input-radio.js';
import HTMLSelectPlugin from './bind-form-plugins/select.js';

const DEFAULT_PLUGINS = [HTMLInputRadioPlugin, HTMLSelectPlugin];
type PluginsNames = 'HTMLInputRadioPlugin' | 'HTMLSelectPlugin';

export class BindForm<BindValues> {
    errors: {
        name: string,
        value: string,
        issues: {
            code: string,
            message: string;
        }[],
        message: string;
    }[] = [];

    /**
     * Events that will be triggered when the form is in a specific state
     */
    public on: {
        newState?: () => void | Promise<void>;
        stateLoaded?: () => void | Promise<void>;
        pagePostBack?: () => void | Promise<void>;
    } = {};

    /**
     * @internal
     */
    _plugins: IHTMLFormPlugin[];

    constructor(private _defaults?: BindValues) {
        this.defaults();
        this.initializePlugins();
    }

    private initializePlugins() {
        this._plugins = DEFAULT_PLUGINS.map(plugin => new plugin(this));
    }

    getPlugin(name: PluginsNames) {
        return this._plugins.find(x => x.constructor.name == name);
    }

    async defaults() {
        Object.assign(this, this._defaults);
    }

    /**
     * @internal
     */
    __finishFormValidation() {
        for (const plugin of this._plugins) {
            plugin.createValidation();
        }
    }

    /**
     * @internal
     */
    __getState() {
        const state = { ...this };
        delete state._defaults;
        delete state._plugins;
        delete state.errors;
        delete state.on;

        return state as any;
    }
}

export type BindTypes<BindValues> = BindForm<BindValues> & BindValues & { [key: string]: any; };
export default function Bind<BindValues>(defaults?: BindValues): BindTypes<BindValues> {
    return <any>new BindForm(defaults);
}
