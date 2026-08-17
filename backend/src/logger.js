/**
 * Minimal structured logger. Keeps the project dependency-light while still
 * giving every line a timestamp, level, and scope so logs are easy to filter.
 */
function timestamp() {
  return new Date().toISOString();
}

function scoped(scope) {
  return {
    info: (...args) => console.log(`[${timestamp()}] [INFO] [${scope}]`, ...args),
    warn: (...args) => console.warn(`[${timestamp()}] [WARN] [${scope}]`, ...args),
    error: (...args) => console.error(`[${timestamp()}] [ERROR] [${scope}]`, ...args),
    debug: (...args) => {
      if (process.env.NODE_ENV !== "production") {
        console.debug(`[${timestamp()}] [DEBUG] [${scope}]`, ...args);
      }
    },
  };
}

module.exports = { scoped };
