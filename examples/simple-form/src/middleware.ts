import { sequence } from 'astro:middleware';
import astroForms from '@astro-utils/forms';

export const onRequest = sequence(astroForms({
    forms: {
        bigFilesUpload: {
            bigFileServerOptions: {
                maxUploadSize: 1024 * 1024 * 1024 * 2.5, // 2.5GB
                maxDirectorySize: 1024 * 1024 * 1024 * 10, // 10GB
            }
        }
    }
}));
