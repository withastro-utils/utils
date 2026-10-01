## [3.0.1](https://github.com/withastro-utils/utils/compare/@astro-utils/express-endpoints@3.0.0...@astro-utils/express-endpoints@3.0.1) (2026-10-01)


### Bug Fixes

* support zod@4 ([9b76dff](https://github.com/withastro-utils/utils/commit/9b76dff459daff53437bce47654b978bad9c8ea9))

# [3.0.0](https://github.com/withastro-utils/utils/compare/@astro-utils/express-endpoints@2.1.2...@astro-utils/express-endpoints@3.0.0) (2026-09-30)


### Bug Fixes

* add explicit MIT license ([e901957](https://github.com/withastro-utils/utils/commit/e901957b0962a9b927643f03632eb757675ace71))


### Features

* **express-endpoints:** http like streaming response & more express like headers methods ([a502b1c](https://github.com/withastro-utils/utils/commit/a502b1c234a508a4f1b2aa93637d167fab8fbc33))


### BREAKING CHANGES

* **express-endpoints:** `responseBody` props is no longer available,  use `send` or `write` instead
* **express-endpoints:** using raw express like http cookies instead of `Astro.cookies`
* **express-endpoints:** response start sending regardless of if the middleware function exited or not
* **express-endpoints:** `ExpressRequest` no longer inherits from `EventEmitter`

# [3.0.0](https://github.com/withastro-utils/utils/compare/@astro-utils/express-endpoints@2.1.2...@astro-utils/express-endpoints@3.0.0) (2026-09-30)


### Bug Fixes

* add explicit MIT license ([e901957](https://github.com/withastro-utils/utils/commit/e901957b0962a9b927643f03632eb757675ace71))


### Features

* **express-endpoints:** http like streaming response & more express like headers methods ([a502b1c](https://github.com/withastro-utils/utils/commit/a502b1c234a508a4f1b2aa93637d167fab8fbc33))


### BREAKING CHANGES

* **express-endpoints:** `responseBody` props is no longer available,  use `send` or `write` instead
* **express-endpoints:** using raw express like http cookies instead of `Astro.cookies`
* **express-endpoints:** response start sending regardless of if the middleware function exited or not
* **express-endpoints:** `ExpressRequest` no longer inherits from `EventEmitter`

## [2.1.2](https://github.com/withastro-utils/utils/compare/@astro-utils/express-endpoints@2.1.1...@astro-utils/express-endpoints@2.1.2) (2025-10-16)


### Bug Fixes

* **express-endpoint:** body response type ([f951d51](https://github.com/withastro-utils/utils/commit/f951d51334047910fd7030bed065587b757ab65b))

## [2.1.1](https://github.com/withastro-utils/utils/compare/@astro-utils/express-endpoints@2.1.0...@astro-utils/express-endpoints@2.1.1) (2024-04-04)


### Bug Fixes

* min & max date ([e8a4b9b](https://github.com/withastro-utils/utils/commit/e8a4b9ba570cac5924fa3e8ebd5d0e27002f558b))

# [2.1.0](https://github.com/withastro-utils/utils/compare/@astro-utils/express-endpoints@2.0.0...@astro-utils/express-endpoints@2.1.0) (2023-12-24)


### Features

* form state (ASPX) ([#3](https://github.com/withastro-utils/utils/issues/3)) ([1f71d80](https://github.com/withastro-utils/utils/commit/1f71d8035b4251f133333cfa35660070a5423492))

# [2.0.0](https://github.com/withastro-utils/utils/compare/@astro-utils/express-endpoints@1.0.3...@astro-utils/express-endpoints@2.0.0) (2023-12-18)


### Features

* multipart using native form parser ([9bbc717](https://github.com/withastro-utils/utils/commit/9bbc71760cfc0ce99daebe7cff62f8e433d4ee6d))


### BREAKING CHANGES

* cannot configure formidable options

## [1.0.3](https://github.com/withastro-utils/utils/compare/@astro-utils/express-endpoints@1.0.2...@astro-utils/express-endpoints@1.0.3) (2023-11-21)


### Bug Fixes

* packages astro keywords ([04faf55](https://github.com/withastro-utils/utils/commit/04faf559ea1326936e137c2783894b2792cfa9af))
