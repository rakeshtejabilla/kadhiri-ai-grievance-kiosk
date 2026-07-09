// Plain CommonJS script (note the .cjs extension) run after compiling
// electron/ with tsc. The root package.json sets "type": "module" so that
// vite.config.ts and the renderer can use ESM import/export syntax, but the
// Electron main/preload processes are compiled to CommonJS (see
// electron/tsconfig.json: "module": "CommonJS") for maximum compatibility
// with Electron's module loader. Node resolves module format per-directory
// by walking up for the nearest package.json, so dropping a
// { "type": "commonjs" } file directly in dist-electron/ overrides the root
// "type": "module" for everything compiled there.
const fs = require("node:fs");
const path = require("node:path");

const outDir = path.join(__dirname, "..", "dist-electron");
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(
  path.join(outDir, "package.json"),
  JSON.stringify({ type: "commonjs" }, null, 2) + "\n",
);

console.log("[mark-commonjs] wrote dist-electron/package.json");
