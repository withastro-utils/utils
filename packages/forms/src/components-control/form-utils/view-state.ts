import {AstroGlobal} from 'astro';
import Cryptr from 'cryptr';
import superjson from 'superjson';
import {parseFormData} from '../../form-tools/post.js';
import {FormsSettings, getFormOptions} from '../../settings.js';
import {BindForm} from './bind-form.js';
import snappy from 'snappy';
import {getSomeProps} from '../props-utils.js';

export default class ViewStateManager {
    private readonly _FORM_OPTIONS: FormsSettings;
    private readonly _cryptr: Cryptr;

    get filedName() {
        if (!this._FORM_OPTIONS.forms) {
            throw new Error('Forms options not set');
        }

        return this._FORM_OPTIONS.forms.viewStateFormFiled + this._counter;
    }

    get stateProp() {
        return this._astro.props.state ?? true;
    }

    get useState() {
        return this.stateProp && this._astro.request.method === 'POST';
    }

    constructor(private _bind: BindForm<any>, private _elementsState: any, private _astro: AstroGlobal, private _counter: number) {
        this._FORM_OPTIONS = getFormOptions(_astro);

        if (!this._FORM_OPTIONS.secret) {
            throw new Error('Secret not set in form options');
        }

        this._cryptr = new Cryptr(this._FORM_OPTIONS.secret, {'encoding': 'base64'});
    }

    private async _extractStateFromForm() {
        const form = await parseFormData(this._astro.request);
        return form.get(this.filedName)?.toString();
    }

    private async _parseState() {
        try {
            const state = await this._extractStateFromForm();
            if(state == null) return;
            
            const data = this._cryptr.decrypt(state);
            const uncompress = await snappy.uncompress(Buffer.from(data, 'base64'));
            return superjson.parse(uncompress.toString());
        } catch (error: any) {
            this._FORM_OPTIONS.logs?.('warn', `ViewStateManager: ${error.message}`);
        }
    }

    public async loadState() {
        if (!this.useState) {
            return false;
        }

        const state: any = await this._parseState();
        if (!state) return;

        Object.assign(this._bind, state.bind);
        Object.assign(this._elementsState, state.elements);
        return;
    }

    public async createViewState(): Promise<string> {
        const data = {
            bind: getSomeProps(this._bind.__getState(), this.stateProp),
            elements: this._elementsState
        };

        const stringify = superjson.stringify(data);
        const compress = await snappy.compress(stringify, {});
        return this._cryptr.encrypt(compress.toString('base64'));
    }
}
