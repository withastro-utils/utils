import fs from 'fs/promises';

export default class UpdateMonorepoPackagesVersion {
    #packageContent;
    #hadUpdate = false;

    /**
     * Update versions of organization packages in `dependencies` and `devDependencies` objects
     * @param packagePath {string}
     */
    constructor(packagePath) {
        this.packagePath = packagePath;
    }

    /**
     * Get default version of organization monorepo packages
     * @returns {string}
     */
    get defaultVersion() {
        return this.#packageContent?.version;
    }

    /**
     * Update versions of organization packages in `dependencies` like object
     * @param data {{[key: string]: string}}
     */
    async #updateVersions(data = {}) {
        for (const key in data) {
            const value = data[key];
            if (key.startsWith('@') && this.defaultVersion === value) {
                data[key] = await UpdateMonorepoPackagesVersion.getLatestVersion(key);
                this.#hadUpdate = true;
            }
        }
    }

    async #readPackageJson() {
        this.#packageContent = await fs.readFile(this.packagePath, 'utf-8').then(JSON.parse);
    }

    async #savePackageJson() {
        await fs.writeFile(this.packagePath, JSON.stringify(this.#packageContent, null, 2));
    }

    async updatePackage() {
        await this.#readPackageJson();
        await this.#updateVersions(this.#packageContent.dependencies);
        await this.#updateVersions(this.#packageContent.devDependencies);
        if (this.#hadUpdate) {
            await this.#savePackageJson();
        }

        return this.#packageContent;
    }

    /**
     * Get the latest version of package from npm registry
     * @param packageName {string}
     * @returns {Promise<string>}
     */
    static async getLatestVersion(packageName) {
        const packageSearch = await fetch(`https://registry.npmjs.org/-/v1/search?text=${packageName}&size=1`);
        const packageSearchJson = await packageSearch.json();
        return packageSearchJson.objects[0].package.version;
    }
}
