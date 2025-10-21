import { markHTMLString } from "../../escape.js";
import { isPromise } from "../../util.js";
import { renderChild } from "../any.js";
const renderTemplateResultSym = Symbol.for("astro.renderTemplateResult");
class RenderTemplateResult {
  [renderTemplateResultSym] = true;
  htmlParts;
  expressions;
  error;
  constructor(htmlParts, expressions) {
    this.htmlParts = htmlParts;
    this.error = void 0;
    this.expressions = expressions.map((expression) => {
      if (isPromise(expression)) {
        return Promise.resolve(expression).catch((err) => {
          if (!this.error) {
            this.error = err;
            throw err;
          }
        });
      }
      return expression;
    });
  }
  async render(destination) {
    // CHANGED: Render expressions synchronously, one after another
    for (let i = 0; i < this.htmlParts.length; i++) {
      const html = this.htmlParts[i];
      const exp = this.expressions[i];

      destination.write(markHTMLString(html));

      // Render each expression one at a time
      if (exp || exp === 0) {
        await renderChild(destination, exp);
      }
    }
  }
}
function isRenderTemplateResult(obj) {
  return typeof obj === "object" && obj !== null && !!obj[renderTemplateResultSym];
}
function renderTemplate(htmlParts, ...expressions) {
  return new RenderTemplateResult(htmlParts, expressions);
}
export {
  RenderTemplateResult,
  isRenderTemplateResult,
  renderTemplate
};