import {VolatileFile, PersistentFile} from 'formidable';

export type FormFile = {
    filepath: string;
    lastModifiedDate: Date;
    mimetype: string;
    newFilename: string;
    originalFilename: string;
    size: number;
}

export type FormDataValue = string | FormFile;

export default class ExtendedFormData {
    #data = new Map<string, FormDataValue[]>();

    #validateFileType(value: FormDataValue) {
        if (typeof value != 'string' && !ExtendedFormData.isFormidableFile(value)) {
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

    getFile(name: string): FormFile | null {
        const value = this.get(name);
        return ExtendedFormData.isFormidableFile(value) ? value as FormFile : null;
    }

    getAllFiles(name: string): (FormFile)[] {
        return this.getAll(name).filter(value => ExtendedFormData.isFormidableFile(value)) as FormFile[];
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

    static isFormidableFile(object: any) {
        return object instanceof VolatileFile || object instanceof PersistentFile;
    }
}
