import type { AstroGlobal } from 'astro';
import { ZodIssueCode, z } from 'zod';
import { getFormMultiValue } from '../../form-tools/post.js';
import AboutFormName from './about-form-name.js';
import { FORM_OPTIONS } from '../../settings.js';
import path from 'path';
import { BigFile } from '../../components/form/UploadBigFile/BigFile.js';
import getContext from '@astro-utils/context';
import fs from 'fs/promises';
import fsExtra from 'fs-extra/esm';

const HEX_COLOR_REGEX = /^#?([0-9a-f]{6}|[0-9a-f]{3})$/i;
const BIG_FILE_START = 'big-file:';

export function parseCheckbox(about: AboutFormName, originalValue?: string) {
    if (originalValue == null) {
        about.formValue = about.formValue === 'on';
    }
}

export function parseNumber(about: AboutFormName, type: 'number' | 'int' | 'range', min?: number, max?: number) {
    let num = z.number();

    if (type === 'int') {
        num = num.int();
    }

    if (min != null) {
        num = num.min(min);
    }

    if (max != null) {
        num = num.max(max);
    }

    about.formValue = Number(about.formValue);
    about.catchParse(num);
}


type DateTypes = 'date' | 'datetime-local' | 'month' | 'week' | 'time';
function parseFormDate(date: Date | string, type?: DateTypes) {
    if (date instanceof Date) {
        return date;
    }

    if (type === 'date' || type === 'datetime-local') {
        date = new Date(date);
    } else if (type === 'time') {
        date = new Date(`1970-01-01T${date}`);
    } else if (type === 'month') {
        date = new Date(`${date}-01`);
    } else if (type === 'week') {
        const year = parseInt(date.substring(0, 4), 10);
        const week = parseInt(date.substring(6, 8), 10) - 1; // Subtract 1 to convert to 0-indexed
        const janFirst = new Date(year, 0, 1);
        const days = (week * 7) - janFirst.getDay() + 1;
        date = new Date(year, 0, days);
    } else {
        date = new Date(date);
    }

    return date;
}

export function parseDate(about: AboutFormName, type: DateTypes, min?: string | Date, max?: string | Date) {
    let date = z.date();

    if (min != null) {
        date = date.min(parseFormDate(min, type));
    }

    if (max != null) {
        date = date.max(parseFormDate(max, type));
    }

    about.formValue = parseFormDate(about.formValue, type);
    about.catchParse(date);
}

export function parseJSON(about: AboutFormName) {
    const EMPTY_OBJECT = {};

    about.catchParse(z.string()
        .transform((str, ctx): z.infer<ReturnType<any>> => {
            try {
                return JSON.parse(str, (key: string, value: any) => {
                    if (EMPTY_OBJECT[key] !== undefined) {
                        return;
                    }
                    return value;
                });
            } catch (e) {
                ctx.addIssue({ code: ZodIssueCode.custom, message: 'Invalid JSON' });
                return z.NEVER;
            }
        }));
}

export function parseEmail(about: AboutFormName) {
    about.catchParse(z.string().email());
}

export function parseURL(about: AboutFormName) {
    about.catchParse(z.string().url());
}

export function parseColor(about: AboutFormName) {
    about.catchParse(z.string().regex(HEX_COLOR_REGEX), 'Invalid hex color');
}


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
        id: z.string().uuid(),
        name: z.string().min(1),
        failed: z.boolean().optional(),
    }));


async function isBigFile(value: string) {
    if (typeof value !== 'string' || !value.startsWith(BIG_FILE_START)) {
        return;
    }

    const tempDirectory = FORM_OPTIONS.forms.bigFilesUpload.bigFileServerOptions.tempDirectory;
    const bigFileInfo = value.substring(BIG_FILE_START.length);

    const { success, data } = zodValidationInfo.safeParse(bigFileInfo);
    if (!success) {
        return;
    }

    if (data.failed) {
        const chunksDir = path.join(tempDirectory, "chunks_" + data.id);
        const errorMessage = path.join(chunksDir, "error.txt");
        try {
            return await fs.readFile(errorMessage, 'utf8');
        } catch {
            return "upload failed";
        } finally {
            await fsExtra.remove(chunksDir);
        }
    }

    const filePath = path.join(tempDirectory, data.id);
    try {
        const fileSize = await BigFile.loadFileSize(filePath);
        return new BigFile(data.name, filePath, fileSize);
    } catch { }
}

export async function parseFiles(about: AboutFormName, astro: AstroGlobal, multiple: boolean, readonly: boolean) {
    if (readonly) return;

    const { disposeFiles } = getContext(astro, '@astro-utils/forms');
    let values = [about.formValue];

    let hasFailed = false;
    if (multiple) {
        values = about.formValue = await getFormMultiValue(astro.request, about.originalName);

        const promises: Promise<any>[] = [];
        for (let i = 0; i < values.length; i++) {
            const promise = isBigFile(values[i]).then((bigFile) => {
                if (!bigFile || hasFailed) {
                    return;
                }

                if (typeof bigFile === "string") {
                    hasFailed = true;
                    about.pushErrorManually('upload-failed', bigFile);
                    return;
                }

                values[i] = bigFile;
                disposeFiles.push(bigFile.path);
            });
            promises.push(promise);
        }
        await Promise.all(promises);
    } else {
        const bigFile = await isBigFile(about.formValue);
        if (bigFile) {
            if (typeof bigFile === "string") {
                about.pushErrorManually('upload-failed', bigFile);
                return;
            }

            values = [about.formValue = bigFile];
            disposeFiles.push(bigFile.path);
        }
    }

    for (const value of values) {
        if (value instanceof File === false && value instanceof BigFile === false) {
            about.pushErrorManually('upload-not-file', 'The upload value is not a file');
            break;
        }
    }
}


export function parseEmptyFiles(about: AboutFormName, astro: AstroGlobal) {
    if(astro.props.readonly) return;

    if (about.formValue.size === 0) {
        about.formValue = null;
    }

    if (astro.props.multiple) {
        about.formValue = [];
    }
}