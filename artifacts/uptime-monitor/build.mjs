import * as esbuild from "esbuild";

await esbuild.build({
  entryPoints: ["src/index.ts"],
  bundle: true,
  platform: "node",
  format: "esm",
  target: "node20",
  outfile: "dist/index.mjs",
  sourcemap: "linked",
  // Node built-ins only — no external npm deps at runtime.
  packages: "external",
  banner: {
    js: `import { createRequire as __req } from 'node:module';
globalThis.require = __req(import.meta.url);`,
  },
});

console.log("Uptime monitor built.");
