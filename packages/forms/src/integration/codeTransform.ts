const ASYNC_RENDERS_REGEX = /render\s*\(\s*destination\s*\)\s*{\s*const\s+flushers\s*=\s*this\.expressions\.map\s*\(\s*\(?exp\)?\s*=>\s*{\s*return\s+createBufferedRenderer\s*\(\s*destination\s*,\s*\(?bufferDestination\)?\s*=>\s*{\s*if\s*\(\s*exp\s*\|\|\s*exp\s*===\s*0\s*\)\s*{\s*return\s+renderChild\s*\(\s*bufferDestination\s*,\s*exp\s*\);\s*}\s*}\s*\);\s*}\s*\);/gs;

const SYNC_RENDERS_CODE_HELPERS = `
const locks = new Map();
async function withLock(scope, key, acquireLockSignalOrCallback, maybeCallback) {
    const signal = acquireLockSignalOrCallback instanceof AbortSignal
        ? acquireLockSignalOrCallback
        : undefined;

    const callback = typeof acquireLockSignalOrCallback === 'function'
        ? acquireLockSignalOrCallback
        : maybeCallback;

    if (typeof callback !== 'function') {
        throw new Error("callback is required");
    }

    if (signal?.aborted) {
        throw signal.reason;
    }

    let keyMap = locks.get(scope);
    if (!keyMap) {
        keyMap = new Map();
        locks.set(scope, keyMap);
    }

    let entry = keyMap.get(key);
    let queue, onDelete;

    if (entry) {
        [queue, onDelete] = entry;

        await new Promise((resolve, reject) => {
            const onResolve = () => {
                signal?.removeEventListener("abort", onAbort);
                resolve();
            };

            const onAbort = () => {
                const index = queue.indexOf(onResolve);
                if (index >= 0) queue.splice(index, 1);
                signal.removeEventListener("abort", onAbort);
                reject(signal.reason);
            };

            queue.push(onResolve);
            if (signal) signal.addEventListener("abort", onAbort);
        });

    } else {
        queue = [];
        onDelete = [];
        keyMap.set(key, [queue, onDelete]);
    }

    try {
        return await callback.call(scope);
    } finally {
        if (queue.length > 0) {
            queue.shift()?.();
        } else {
            keyMap.delete(key);
            if (keyMap.size === 0) {
                locks.delete(scope);
            }
            for (const fn of onDelete) fn();
        }
    }
}`;

const SYNC_RENDERS_CODE = `
render(destination) {
  const flushers = this.expressions.map((exp) => {
      return createBufferedRenderer(destination, (bufferDestination) => {
          // Skip render if falsy, except the number 0
          if (exp || exp === 0) {
              return withLock(this, '_lockRender', () => renderChild(bufferDestination, exp));
          }
      });
  });
`;

export function refactorCodeInlineRenderComponent(sourceCode: string): string {
  if (ASYNC_RENDERS_REGEX.test(sourceCode)) {
    return SYNC_RENDERS_CODE_HELPERS + sourceCode.replace(ASYNC_RENDERS_REGEX, SYNC_RENDERS_CODE);
  }

  return sourceCode;
}
