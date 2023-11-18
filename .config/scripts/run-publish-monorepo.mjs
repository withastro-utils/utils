import ScanPublishOrder from './scan-publish-order.mjs';
import {fileURLToPath} from 'node:url';
import * as path from 'node:path';
import UpdateMonorepoPackagesVersion from './update-monorepo-packages-version.mjs';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const PACKAGES_PATH = path.join(__dirname, '..', '..', 'packages');

async function updateAllPackages(callback) {
    const packagesPathByOrder = await new ScanPublishOrder(PACKAGES_PATH).getReleaseOrder();

    for (const packagePath of packagesPathByOrder) {
        const packageJsonPath = path.join(packagePath, 'package.json');
        const {name} = await new UpdateMonorepoPackagesVersion(packageJsonPath).updatePackage();
        callback?.(packagePath, name);
    }
}

async function main() {
    await updateAllPackages();
    await updateAllPackages((packagePath, name) => {
        execSync('npm run release -- --tag-format=\'' + name + '@${version}\'', {cwd: packagePath, stdio: 'inherit'});
        }
    );
}

await main();
