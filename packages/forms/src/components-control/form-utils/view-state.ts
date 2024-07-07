import { AstroGlobal } from 'astro';
import superjson from 'superjson';
import { parseFormData } from '../../form-tools/post.js';
import { FormsSettings, getFormOptions } from '../../settings.js';
import { BindForm } from './bind-form.js';
import snappy from 'snappy';
import { getSomeProps, omitProps } from '../props-utils.js';
import crypto from 'crypto';

const CRYPTO_ALGORITHM = 'aes-256-ctr';

export default class ViewStateManager {
    private readonly _FORM_OPTIONS: FormsSettings;
    private _VALID_KEY: string;

    get filedName() {
        if (!this._FORM_OPTIONS.forms) {
            throw new Error('Forms options not set');
        }

        return this._FORM_OPTIONS.forms.viewStateFormFiled + this._bindId;
    }

    get stateProp() {
        return this._astro.props.state ?? true;
    }

    get omitProps() {
        return this._astro.props.omitState;
    }

    get useState() {
        return this.stateProp && this._astro.request.method === 'POST';
    }

    constructor(private _bind: BindForm<any>, private _elementsState: any, private _astro: AstroGlobal, private _bindId: string | number) {
        this._FORM_OPTIONS = getFormOptions(_astro);

        if (!this._FORM_OPTIONS.secret) {
            throw new Error('Secret not set in form options');
        }
        this._initKey();
    }

    private _initKey() {
        const repeat = Math.ceil(32 / this._FORM_OPTIONS.secret.length);
        this._VALID_KEY = this._FORM_OPTIONS.secret.repeat(repeat).slice(0, 32);
    }

    private async _extractStateFromForm() {
        const form = await parseFormData(this._astro.request);
        return form.get(this.filedName)?.toString();
    }

    private async _parseState() {
        try {
            const state = await this._extractStateFromForm();
            if (state == null) return;

            const [iv, content] = state.split('.');

            const decipher = crypto.createDecipheriv(CRYPTO_ALGORITHM, this._VALID_KEY, Buffer.from(iv, 'base64'));
            const decrypted = Buffer.concat([decipher.update(Buffer.from(content, 'base64')), decipher.final()]);

            const uncompress = await snappy.uncompress(decrypted);
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
        if (!state) return false;

        if(state.bind && state.elements){
            Object.assign(this._bind, state.bind);
            Object.assign(this._elementsState, state.elements);
        }
        return true;
    }

    public async createViewState(): Promise<string> {
        const data = {
            bind: this.omitProps ?
                omitProps(this._bind.__getState(), this.omitProps):
                getSomeProps(this._bind.__getState(), this.stateProp),
            elements: this._elementsState
        };

        const stringify = superjson.stringify(data);
        const compress = await snappy.compress(stringify, {});

        const iv = crypto.randomBytes(16);
        const cipher = crypto.createCipheriv(CRYPTO_ALGORITHM, this._VALID_KEY, iv);
        const encrypted = Buffer.concat([cipher.update(compress), cipher.final()]);

        return `${iv.toString('base64')}.${encrypted.toString('base64')}`;
    }
}
