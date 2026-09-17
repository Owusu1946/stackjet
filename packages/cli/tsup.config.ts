import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/cli.ts"],
  format: ["esm"],
  dts: true,
  clean: true,
  noExternal: [
    "@expojet/adapters",
    "@expojet/brand",
    "@expojet/core",
    "@expojet/schemas",
    "@expojet/sdk-57",
  ],
  banner: { js: "#!/usr/bin/env node" },
});
