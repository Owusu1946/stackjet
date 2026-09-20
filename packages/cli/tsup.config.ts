import { defineConfig } from "tsup";

export default defineConfig({
  entry: { cli: "src/cli.ts", generation: "src/preview-generation.ts" },
  format: ["esm"],
  dts: true,
  clean: true,
  splitting: false,
  noExternal: [
    "@expojet/adapters",
    "@expojet/brand",
    "@expojet/core",
    "@expojet/schemas",
    "@expojet/sdk-57",
  ],
  banner: { js: "#!/usr/bin/env node" },
});
