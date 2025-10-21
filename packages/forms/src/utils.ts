import type {AstroGlobal} from 'astro';
import {FormsSettings} from './settings.js';
import AwaitLockDefault from 'await-lock';
import FormsReact from './form-tools/forms-react.js';
import { BindContext } from './components-control/types.js';

export function createLock(): InstanceType<typeof AwaitLockDefault['default']> {
    if ('default' in AwaitLockDefault) {
        return new AwaitLockDefault.default();
    }

    return new (AwaitLockDefault as any)();
}

export type ExtendedRequest = AstroGlobal['request'] & {
    formDataLock?: ReturnType<typeof createLock>
    validateFormLock?: ReturnType<typeof createLock>
    formData: (Request['formData'] | (() => FormData | Promise<FormData>)) & {
        requestFormValid?: boolean
    }
}

export interface AstroLinkHTTP {
  request: ExtendedRequest;
  cookies: AstroGlobal['cookies']
  locals: AstroGlobal['locals'];
}

declare global {
  export namespace App {
      interface Locals {
          /**
           * @internal
           */
          __formsInternalUtils: {
              FORM_OPTIONS: FormsSettings;
              bindFormCounter: number;
              bindGlobalState: Record<string | number, BindContext>;
          };
          forms: FormsReact;
          webFormOff?: boolean;
          session: {
              [key: string]: any;
          };
      }
  }
}

export type ModifyDeep<A, B extends DeepPartialAny<A>> = {
  [K in keyof A | keyof B]:          // For all keys in A and B:
  K extends keyof A                // ───┐
  ? K extends keyof B            // ───┼─ key K exists in both A and B
  ? A[K] extends AnyObject     //    │  ┴──┐
  ? B[K] extends AnyObject   //    │  ───┼─ both A and B are objects
  ? ModifyDeep<A[K], B[K]> //    │     │  └─── We need to go deeper (recursively)
  : B[K]                   //    │     ├─ B is a primitive 🠆 use B as the final type (new type)
  : B[K]                     //    │     └─ A is a primitive 🠆 use B as the final type (new type)  
  : A[K]                       //    ├─ key only exists in A 🠆 use A as the final type (original type)   
  : B[K]                         //    └─ key only exists in B 🠆 use B as the final type (new type)
}

type AnyObject = Record<string, any>

// This type is here only for some intellisense for the overrides object
type DeepPartialAny<T> = {
  /** Makes each property optional and turns each leaf property into any, allowing for type overrides by narrowing any. */
  [P in keyof T]?: T[P] extends AnyObject ? DeepPartialAny<T[P]> : any
}
