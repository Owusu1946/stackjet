import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/cli.ts"],
  format: ["esm"],
  dts: true,
  clean: true,
  noExternal: [
    "@stackjet/adapters",
    "@stackjet/brand",
    "@stackjet/core",
    "@stackjet/schemas",
    "@stackjet/sdk-57",
  ],
  banner: { js: "#!/usr/bin/env node" },
});
