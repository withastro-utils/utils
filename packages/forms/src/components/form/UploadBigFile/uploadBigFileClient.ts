import { v4 as uuid } from 'uuid';

type ProgressCallback = (progress: number, total: number) => void;

export type BigFileUploadOptions = {
    retryChunks: number;
    chunkSize: number;
    parallelChunks: number;
    parallelUploads: number;
};

const UPLOAD_BIG_FILE_OPTIONS: BigFileUploadOptions = {
    retryChunks: 5,
    chunkSize: 1024 * 1024 * 5,
    parallelChunks: 3,
    parallelUploads: 3,
};

const clientWFS = (window as any).clientWFS;

async function uploadChunkWithXHR(file: Blob, info: Record<string, any>, progressCallback: ProgressCallback) {
    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        const formData = new FormData();
        xhr.responseType = "text";

        formData.append('file', file);
        formData.append("astroBigFileUpload", "true");
        formData.append('info', JSON.stringify(info));

        if (clientWFS.csrf) {
            formData.append(clientWFS.csrf.filed, clientWFS.csrf.token);
        }

        xhr.upload.onprogress = (event) => {
            progressCallback(event.loaded, event.total);
        };

        xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
                resolve(JSON.parse(xhr.responseText));
            } else {
                reject({ok: false, error: xhr.responseText});
            }
        };
        xhr.onerror = () => {
            reject({ok: false, error: xhr.responseText});
        };

        xhr.open('POST', location.href, true);
        xhr.send(formData);
    });
}

async function uploadBigFile(fileId: string, file: File, progressCallback: ProgressCallback, options: BigFileUploadOptions) {
    const totalSize = file.size;
    const totalChunks = Math.ceil(totalSize / options.chunkSize);

    const activeChunks = new Set<Promise<void>>();
    const activeLoads = new Map<number, number>();
    let finishedSize = 0;

    const uploadChunk = async (i: number) => {
        while (activeChunks.size >= options.parallelChunks) {
            await Promise.race(activeChunks);
        }

        // last chunks should wait for all active chunks to finish
        if (i + 1 === totalChunks) {
            await Promise.all(activeChunks);
        }

        const start = i * options.chunkSize;
        const end = Math.min(totalSize, start + options.chunkSize);
        const chunk = file.slice(start, end);

        const info = {
            uploadId: fileId,
            uploadSize: totalSize,
            part: i + 1,
            total: totalChunks,
        };

        const uploadPromiseWithRetry = (async function uploadPromise(retry = options.retryChunks) {
            const upload = uploadChunkWithXHR(chunk, info, (loaded) => {
                activeLoads.set(i, loaded);
                const loadedSize = Array.from(activeLoads.values()).reduce((a, b) => a + b, 0);
                progressCallback(finishedSize + loadedSize, totalSize);
            });

            try {
                const response: any = await upload;
                if(response?.missingChunk){
                    await uploadChunk(response?.missingChunk - 1);
                }

                if (!response?.ok) {
                    throw new Error(response.error);
                }
            } catch (error) {
                if (retry === 0) {
                    throw error;
                }
                return await uploadPromise(retry - 1);
            }
        })().then(() => {
            activeLoads.delete(i);
            activeChunks.delete(uploadPromiseWithRetry);
            finishedSize += chunk.size;
        });

        activeChunks.add(uploadPromiseWithRetry);
    }

    for (let i = 0; i < totalChunks; i++) {
        await uploadChunk(i);
    }

    await Promise.all(activeChunks);
}

export async function uploadAllFiles(els: NodeListOf<HTMLInputElement>, options: BigFileUploadOptions = { ...UPLOAD_BIG_FILE_OPTIONS, ...clientWFS.bigFileUploadOptions }) {
    const activeUploads = new Map<string, Promise<any>>();
    const filesToUpload = new Map<HTMLInputElement, string>();

    let failed = false;
    for (const el of els) {
        el.disabled = true;

        const files = el.files;
        if (!files || files.length === 0) {
            continue;
        }

        const progress = document.querySelector(`progress[data-for="${el.name}"]`) as HTMLProgressElement;
        const progressCallback = (loaded: number, total: number) => {
            if (!progress) return;
            progress.value = Math.round((loaded / total) * 100);
        };

        for (const file of files) {
            while (activeUploads.size >= options.parallelUploads) {
                await Promise.race(activeUploads.values());
            }

            if (progress) {
                const onActiveClasses = progress.getAttribute('data-onactive-class');

                if (onActiveClasses) {
                    const addClass = onActiveClasses.split(' ').filter(Boolean);
                    if (addClass.length > 0) {
                        progress.classList.add(...addClass);
                    }
                }
            }

            const fileId = uuid();
            if(failed){
                onUploadFinished(el, file, fileId, true);
                continue;
            }

            const upload = uploadBigFile(fileId, file, progressCallback, options).then(() => {
                activeUploads.delete(file.name);
                filesToUpload.set(el, fileId);
                onUploadFinished(el, file, fileId);
            }).catch(() => {
                failed = true;
                onUploadFinished(el, file, fileId, true);
            });

            activeUploads.set(file.name, upload);
        }
    }

    await Promise.all(activeUploads.values());
    return filesToUpload;
}

function onUploadFinished(el: HTMLInputElement, file: File, id: string, failed?: boolean) {
    const inputElement = document.createElement('input');
    inputElement.type = 'hidden';
    inputElement.name = el.name;
    inputElement.value = `big-file:${JSON.stringify({ id, name: file.name, failed})}`;
    el.required = false;
    el.removeAttribute('name');
    el.after(inputElement);
}

export function countTotalUploads(els: NodeListOf<HTMLInputElement>): { count: number, totalSize: number; } {
    let count = 0;
    let totalSize = 0;

    for (const el of els) {
        const files = el.files;
        if (!files || files.length === 0) {
            continue;
        }

        for (const file of files) {
            count++;
            totalSize += file.size;
        }
    }

    return { count, totalSize };
}

export function finishFormSubmission(form: HTMLFormElement, onClick?: string) {
    if (onClick) {
        const inputElement = document.createElement('input');
        inputElement.type = 'hidden';
        inputElement.name = 'button-callback';
        inputElement.value = onClick;
        form.append(inputElement);
    }

    form.submit();
}