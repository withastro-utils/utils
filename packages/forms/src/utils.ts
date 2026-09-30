import type {AstroGlobal} from 'astro';
import type { HTMLAttributes, HTMLTag } from 'astro/types';
import type {FormsSettings} from './settings.js';
import type FormsReact from './form-tools/forms-react.js';
import type { BindContext } from './components-control/types.js';

export type Component = ((props: any) => any) | (new (props: any) => any);
export type ComponentProps<T extends HTMLTag | Component> = T extends HTMLTag ? HTMLAttributes<T> : T extends (props: infer Props) => any ? Props : T extends new (props: infer Props) => any ? Props : never;

export type ExtendedRequest = AstroGlobal['request'] & {
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
              bindGlobalState: Record<string | number, BindContext>;
              rootContext: Record<string, any>;
                activeGeneratedIds: Set<string>;
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
