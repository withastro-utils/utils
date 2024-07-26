import { createReadStream } from "fs";
import { type CreateReadStreamOptions, stat, copyFile } from "fs/promises";

export class BigFile {
    /**
     * @internal
     */
    constructor(public readonly name: string, public readonly path: string, public readonly size: number) {

    }

    stream(options?: BufferEncoding | CreateReadStreamOptions) {
        return createReadStream(this.path, options);
    }

    copyTo(destination: string) {
        return copyFile(this.path, destination);
    }

    /**
     * @internal
     */
    static async loadFileSize(path: string) {
        const file = await stat(path);
        if (!file.isFile()) {
            throw new Error('Not a file');
        }
        return file.size;
    }
}