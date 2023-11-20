import {ExpressRoute} from '@astro-utils/express-endpoints';
import {z} from 'zod';

const router = new ExpressRoute();

router.body('auto', {
    maxFileSize: 10 * 1024 * 1024 // 10MB
});

// this validation will only apply to the next route (the PUT route)
router.validate({
    body: z.object({
        name: z.string()
    })
});

export const PUT = router.route(async (req, res) => {
    await new Promise(res => setTimeout(res, 1000));
    res.json({
        name: req.body.name,
        url: 'This is a PUT request'
    });
});

export const POST = router.route((req, res) => {
    const myFile = req.filesOne.myFile;

    res.json({
        name: myFile?.originalFilename || 'No file',
    });
});
