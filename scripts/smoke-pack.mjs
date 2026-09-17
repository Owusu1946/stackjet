import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const root = new URL("..", import.meta.url).pathname.replace(/^\/(.:)/, "$1");
execFileSync("pnpm", ["--filter", "create-expojet", "build"], { cwd: root, stdio: "inherit", shell: process.platform === "win32" });
const output = execFileSync("pnpm", ["--filter", "create-expojet", "pack", "--pack-destination", mkdtempSync(join(tmpdir(), "expojet-pack-"))], { cwd: root, encoding: "utf8", shell: process.platform === "win32" });
if (!output.includes("create-expojet")) throw new Error("Package tarball was not created");
const pkg = JSON.parse(readFileSync(join(root, "packages/cli/package.json"), "utf8"));
if (!pkg.bin?.["create-expojet"]) throw new Error("Tarball entrypoint is missing");
const privateRuntimeDependencies = Object.keys(pkg.dependencies ?? {}).filter((name) =>
  name.startsWith("@expojet/"),
);
if (privateRuntimeDependencies.length > 0)
  throw new Error(`Private runtime dependencies would break pnpm dlx: ${privateRuntimeDependencies.join(", ")}`);
console.log("Published-tarball smoke preflight passed");
