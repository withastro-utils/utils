
/**
const expRenders = this.expressions.map(exp => {
  return renderToBufferDestination(bufferDestination => {
    if (exp || exp === 0) {
      return renderChild(bufferDestination, exp);
    }
  });
});
 */
const ASYNC_RENDERS_REGEX = /const\s+expRenders\s*=\s*this\.expressions\.map\s*\(\s*\(?exp\)?\s*=>\s*{\s*return\s+renderToBufferDestination\s*\(\s*\(?bufferDestination\)?\s*=>\s*{\s*if\s*\(\s*exp\s*\|\|\s*exp\s*===\s*0\s*\)\s*{\s*return\s+renderChild\s*\(\s*bufferDestination\s*,\s*exp\s*\);\s*}\s*}\s*\);\s*}\s*\);/gs;

const SYNC_RENDERS_CODE = `
const expRenders = [];
for (const exp of this.expressions) {
    const promise = renderToBufferDestination(bufferDestination => {
    if (exp || exp === 0) {
        return renderChild(bufferDestination, exp);
    }
    });

    await promise.renderPromise;
    expRenders.push(promise);
}
`;

export function refactorCodeInlineRenderComponent(sourceCode: string): string {
  return sourceCode.replace(ASYNC_RENDERS_REGEX, SYNC_RENDERS_CODE);
}
