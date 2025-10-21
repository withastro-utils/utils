import { escapeHTML, isHTMLString, markHTMLString } from "../escape.js";
import { isPromise } from "../util.js";
import { isAstroComponentInstance, isRenderTemplateResult } from "./astro/index.js";
import { isRenderInstance } from "./common.js";
import { SlotString } from "./slot.js";

async function renderChild(destination, child) {
  if (isPromise(child)) {
    child = await child;
  }
  if (child instanceof SlotString) {
    destination.write(child);
  } else if (isHTMLString(child)) {
    destination.write(child);
  } else if (Array.isArray(child)) {
    // CHANGED: Render children synchronously, one after another
    for (const c of child) {
      await renderChild(destination, c);
    }
  } else if (typeof child === "function") {
    await renderChild(destination, child());
  } else if (typeof child === "string") {
    destination.write(markHTMLString(escapeHTML(child)));
  } else if (!child && child !== 0) {
    // do nothing, safe to ignore falsey values
  } else if (isRenderInstance(child)) {
    await child.render(destination);
  } else if (isRenderTemplateResult(child)) {
    await child.render(destination);
  } else if (isAstroComponentInstance(child)) {
    await child.render(destination);
  } else if (ArrayBuffer.isView(child)) {
    destination.write(child);
  } else if (typeof child === "object" && (Symbol.asyncIterator in child || Symbol.iterator in child)) {
    for await (const value of child) {
      await renderChild(destination, value);
    }
  } else {
    destination.write(child);
  }
}

export {
  renderChild
};