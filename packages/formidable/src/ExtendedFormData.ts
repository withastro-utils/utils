import {File} from 'formidable';

export type FormDataValue = string | File;

export default class ExtendedFormData {
    #data = new Map<string, FormDataValue[]>();

    #validateFileType(value: FormDataValue) {
        if (typeof value != 'string' && !(value instanceof File)) {
            return String(value);
        }
        return value;
    }

    append(name: string, value: FormDataValue) {
        if (this.#data.has(name)) {
            this.#data.get(name).push(
                this.#validateFileType(value)
            );
        } else {
            this.set(name, value);
        }
    }

    delete(name: string) {
        this.#data.delete(name);
    }

    get(name: string): FormDataValue | null {
        return this.#data.get(name)?.[0];
    }

    getAll(name: string): FormDataValue[] {
        return this.#data.get(name) ?? [];
    }

    getText(name: string): string | null {
        const value = this.get(name);
        return typeof value == 'string' ? value : null;
    }

    getAllText(name: string): string[] {
        return this.getAll(name).filter(value => typeof value == 'string') as string[];
    }

    getFile(name: string): File | null {
        const value = this.get(name);
        return value instanceof File ? value as File : null;
    }

    getAllFiles(name: string): File[] {
        return this.getAll(name).filter(value => value instanceof File) as File[];
    }

    has(name: string): boolean {
        return this.get(name) != null;
    }

    set(name: string, value: FormDataValue): void {
        this.#data.set(name, [this.#validateFileType(value)]);
    }

    entries(): IterableIterator<[string, FormDataValue[]]> {
        return this.#data.entries();
    }

    keys(): IterableIterator<string> {
        return this.#data.keys();
    }

    values(): IterableIterator<FormDataValue[]> {
        return this.#data.values();
    }

    forEach(callbackfn: (value: FormDataValue[], key: string, parent: ExtendedFormData) => void, thisArg?: any) {
        for (const [key, value] of this.entries()) {
            callbackfn(value, key, thisArg ?? this);
        }
    }

    [Symbol.iterator](): IterableIterator<[string, FormDataValue[]]> {
        return this.#data[Symbol.iterator]();
    }
}
