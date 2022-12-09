import PersistentFile from "formidable/src/PersistentFile.js";

type FormDataValue = string | PersistentFile;

export default class ExtendedFormData {
    #data = new Map<string, FormDataValue[]>();

    #validateFileType(value: FormDataValue) {
        if (typeof value != 'string' && !(value instanceof PersistentFile)) {
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

    get(name: string): FormDataEntryValue | null | PersistentFile {
        return this.#data.get(name)?.[0];
    }

    getAll(name: string): FormDataEntryValue[] | PersistentFile[] {
        return this.#data.get(name) ?? [];
    }

    has(name: string): boolean {
        return this.get(name) != null;
    }

    set(name: string, value: string | Blob): void {
        this.#data.set(name, [this.#validateFileType(value)]);
    }

    entries(): IterableIterator<[string, FormDataValue]> {
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

    [Symbol.iterator](): IterableIterator<[string, FormDataValue]> {
        return this.#data[Symbol.iterator]();
    }
}