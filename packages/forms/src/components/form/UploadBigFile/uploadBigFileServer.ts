import fsExtra from "fs-extra/esm";
import fs from "fs/promises";
import oldFs from "fs";
import path from "path";
import z from "zod";
import os from "os";
import { validateFrom } from "../../../form-tools/csrf.js";
import { AstroGlobal } from "astro";
import { getFormValue } from "../../../form-tools/post.js";
import ThrowOverrideResponse from '../../../throw-action/throwOverrideResponse.js';

const zodValidationInfo =
    z.preprocess((str: any, ctx) => {
        try {
            return JSON.parse(str);
        } catch {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "Invalid JSON",
            });
            return z.NEVER;
        }
    }, z.object({
        uploadId: z.string().uuid(),
        uploadSize: z.number().min(1),
        part: z.number().min(1),
        total: z.number().min(1),
    }));

export type LoadUploadFilesOptions = {
    allowUpload?: (file: File, info: z.infer<typeof zodValidationInfo>) => boolean | Promise<boolean>;
    onFinished?: (fileId: string, totalSize: number) => void | Promise<void>;
    maxUploadTime?: number;
    maxUploadSize?: number;
    maxDirectorySize?: number;
    tempDirectory: string;
};

export const DEFAULT_BIG_FILE_UPLOAD_OPTIONS_SERVER: LoadUploadFilesOptions = {
    maxUploadTime: 1000 * 60 * 60 * 1.5, // 1.5 hour
    maxUploadSize: 1024 * 1024 * 1024, // 1GB
    maxDirectorySize: 1024 * 1024 * 1024 * 50, // 50GB
    tempDirectory: path.join(os.tmpdir(), "astro_forms_big_files_uploads"),
};

const ACTIVE_FINISHED_UPLOADS = new Set<string>();

async function loadUploadFiles(astro: AstroGlobal, options: Partial<LoadUploadFilesOptions> = {}) {
    const { allowUpload, onFinished, maxUploadTime, maxUploadSize, maxDirectorySize, tempDirectory } = { ...DEFAULT_BIG_FILE_UPLOAD_OPTIONS_SERVER, ...options };
    if (astro.request.method !== "POST" || !await validateFrom(astro)) {
        return false;
    }

    if (await getFormValue(astro.request, "astroBigFileUpload") !== "true") {
        return false;
    }

    const hasWait = await getFormValue(astro.request, "wait");
    if (hasWait) {
        const thisWait = String(hasWait);
        return Response.json({ ok: true, wait: ACTIVE_FINISHED_UPLOADS.has(thisWait) });
    }


    await fsExtra.ensureDir(tempDirectory);
    await deleteOldUploads(tempDirectory, maxUploadTime);
    const uploadInfo = await getFormValue(astro.request, "info");
    const uploadFileMayBe = await getFormValue(astro.request, "file");

    const { data, success } = zodValidationInfo.safeParse(uploadInfo);
    if (!success || uploadFileMayBe instanceof File === false) {
        return Response.json({ ok: false, error: "Invalid request" });
    }
    const uploadFile = uploadFileMayBe as File;

    const { uploadId, uploadSize, part, total } = data;

    const uploadDir = path.join(tempDirectory, 'chunks_' + uploadId);
    await fsExtra.ensureDir(uploadDir);

    const sendError = async (errorMessage: string, emptyDir = true, extraInfo?: any) => {
        if (emptyDir) {
            await fsExtra.emptyDir(uploadDir);
        }
        const errorPath = path.join(uploadDir, 'error.txt');
        if (!await checkIfFileExists(errorPath)) {
            await fs.writeFile(path.join(uploadDir, 'error.txt'), errorMessage);
        }
        return Response.json({ ok: false, error: errorMessage, ...extraInfo });
    };

    if (typeof allowUpload === "function") {
        if (!await allowUpload(uploadFile, data)) {
            return await sendError("File not allowed");
        }
    }

    if (uploadSize > maxUploadSize) {
        return await sendError("File size exceeded");
    }

    const totalDirectorySizeWithNewUpload = (await totalDirectorySize(tempDirectory)) + part === 1 ? uploadSize : uploadFile.size;
    if (totalDirectorySizeWithNewUpload > maxDirectorySize) {
        return await sendError("Directory size exceeded");
    }

    const newTotalSize = (await totalDirectorySize(uploadDir)) + uploadFile.size;
    if (newTotalSize > maxUploadSize) {
        return await sendError("Upload size exceeded");
    }

    const uploadFilePath = path.join(tempDirectory, uploadId);
    if (await checkIfFileExists(uploadFilePath)) {
        return await sendError("Upload already exists");
    }


    const chunkSavePath = path.join(uploadDir, `${part}-${total}`);
    if (!await checkIfFileExists(chunkSavePath)) {
        const buffer = await uploadFile.arrayBuffer();
        await fs.writeFile(chunkSavePath, Buffer.from(buffer));
    }

    if (part !== total) {
        return Response.json({ ok: true });
    }

    const files = await fs.readdir(uploadDir);
    const missingChunks = [];
    for (let i = 1; i <= total; i++) {
        if (!files.includes(`${i}-${total}`)) {
            missingChunks.push(i);
        }
    }
    if (missingChunks.length > 0) {
        return await sendError(`Missing chunks ${missingChunks}, upload failed`, false, { missingChunks });
    }

    (async () => {
        try {
            ACTIVE_FINISHED_UPLOADS.add(uploadId);
            const outputStream = oldFs.createWriteStream(uploadFilePath, { flags: 'a' });
            for (let i = 1; i <= total; i++) {
                const fileFullPath = path.join(uploadDir, `${i}-${total}`);
                const inputStream = oldFs.createReadStream(fileFullPath);
                await new Promise((resolve, reject) => {
                    inputStream.on("data", (chunk) => {
                        outputStream.write(chunk);
                    });
                    inputStream.on("end", resolve);
                    inputStream.on("error", reject);
                });
                await fsExtra.remove(fileFullPath);
            }
            await fsExtra.remove(uploadDir);

            await onFinished?.(uploadId, files.length);
        } finally {
            ACTIVE_FINISHED_UPLOADS.delete(uploadId);
        }
    })();

    return Response.json({ ok: true, finished: true });
}

export async function processBigFileUpload(astro: AstroGlobal, options: Partial<LoadUploadFilesOptions> = astro.locals.__formsInternalUtils.FORM_OPTIONS.forms?.bigFilesUpload?.bigFileServerOptions) {
    const haveFileUpload = await loadUploadFiles(astro, options);
    if (haveFileUpload) {
        throw new ThrowOverrideResponse(haveFileUpload);
    }
}

async function deleteOldUploads(tempDirectory: string, maxUploadTime: number) {
    const files = await fs.readdir(tempDirectory);
    for (const file of files) {
        const fullPath = path.join(tempDirectory, file);

        try {
            const stat = await fs.stat(fullPath);
            if (Date.now() - stat.mtime.getTime() > maxUploadTime) {
                await fsExtra.remove(fullPath);
            }
        } catch (error) {
            if (error.code !== "ENOENT") {
                throw error;
            }
        }
    }
}

async function totalDirectorySize(directory: string) {
    const files = await fs.readdir(directory);
    let totalSize = 0;

    const promises = [];
    for (const file of files) {
        const fullPath = path.join(directory, file);
        try {
            const stat = await fs.stat(fullPath);

            if (stat.isDirectory()) {
                promises.push(totalDirectorySize(fullPath));
            } else {
                totalSize += stat.size;
            }
        } catch (error) {
            if (error.code !== "ENOENT") {
                throw error;
            }
        }
    }

    totalSize += (await Promise.all(promises)).reduce((a, b) => a + b, 0);
    return totalSize;
}

export async function checkIfFileExists(filePath: string) {
    try {
        const file = await fs.stat(filePath);
        return file.isFile();
    } catch {
        return false;
    }
}