import fs from 'fs/promises';
import * as path from 'node:path';

const DEFAULT_ORGANIZATION_PACKAGE_VERSION = '0.0.0';

export default class ScanPublishOrder {
    /**
     * @typedef {{
     *      [packageName: string]: string
     *  }} Dependencies
     *
     * @type {{
     *     [packagePath: string]: {
     *         name: string,
     *         dependencies: Dependencies,
     *         devDependencies: Dependencies
     *     }
     * }}
     */
    #packagesContent = {};

    /**
     * Package name by dependency order
     * @type {string[]}
     */
    #packagesOrder = [];

    /**
     * Package path by dependency order
     * @returns {string[]}
     */
    get #packagesOrderPath() {
        const entries = Object.entries(this.#packagesContent);
        return this.#packagesOrder.map(packageName => {
            const packageFound = entries.find(([, packageContent]) => packageContent.name === packageName);
            return packageFound[0];
        });
    }


    /**
     *
     * @param scanLocation {string}
     */
    constructor(scanLocation) {
        this.scanLocation = scanLocation;
    }

    async #readAllPackages() {
        const packages = await fs.readdir(this.scanLocation);
        for (const packageName of packages) {
            const packagePath = path.join(this.scanLocation, packageName);
            const packageJsonPath = path.join(packagePath, 'package.json');
            if (await fs.stat(packageJsonPath).then(stat => stat.isFile())) {
                const packageContent = await fs.readFile(packageJsonPath, 'utf-8').then(JSON.parse);
                this.#packagesContent[packagePath] = packageContent;
            }
        }
    }

    async #orderByDependencies() {
        let somethingChanged = true;

        while (somethingChanged) {
            somethingChanged = false;
            for (const content of Object.values(this.#packagesContent)) {
                if (this.#packagesOrder.includes(content.name)) {
                    continue;
                }

                if (this.#checkOkToBeNextInOrder(content.dependencies)) {
                    this.#packagesOrder.push(content.name);
                    somethingChanged = true;
                }
            }
        }
    }

    /**
     * Check if all package dependencies already published
     * @param dependencies {Dependencies}
     * @returns {boolean}
     */
    #checkOkToBeNextInOrder(dependencies = {}) {
        for (const [key, value] of Object.entries(dependencies)) {
            if (value === DEFAULT_ORGANIZATION_PACKAGE_VERSION && !this.#packagesOrder.includes(key)) {
                return false;
            }
        }
        return true;
    }

    #assertMissingPackages() {
        const missingPackages = Object.values(this.#packagesContent).filter(content => !this.#packagesOrder.includes(content.name));
        if (missingPackages.length) {
            throw new Error(`Missing packages: ${missingPackages.map(content => content.name).join(', ')}, probably circular dependencies`);
        }
    }

    async getReleaseOrder() {
        await this.#readAllPackages();
        await this.#orderByDependencies();
        this.#assertMissingPackages();
        return this.#packagesOrderPath;
    }
}
