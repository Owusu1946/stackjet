import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { runDoctorChecks } from "./checks.js";
import { loadProjectContext } from "./project.js";

const standaloneManifest = `{
  "$schema": "https://expojet.dev/schemas/project.schema.json",
  "generatorVersion": "0.6.2",
  "sdk": 57,
  "sdkPackSha256": "899cf2ab609d2ccf065219d049af66dd19768c06e7f7b31b19dd06c437101847",
  "structure": "standalone",
  "packageManager": "pnpm",
  "adapters": { "auth": "none", "style": "stylesheet" }
}`;

function standaloneProject(extra?: { leakSecret?: boolean }) {
  const root = mkdtempSync(join(tmpdir(), "expojet-checks-"));
  writeFileSync(join(root, "expojet.jsonc"), standaloneManifest);
  mkdirSync(join(root, "src"), { recursive: true });
  writeFileSync(
    join(root, "src", "app.tsx"),
    extra?.leakSecret
      ? 'export const x = "CLERK_SECRET_KEY=sk_test";'
      : "export default function App() { return null; }",
  );
  return loadProjectContext(root);
}

describe("runDoctorChecks mobile secret boundary", () => {
  it("passes for standalone when mobile tree has no server env names", () => {
    const project = standaloneProject();
    const check = runDoctorChecks(project).find((c) => c.name === "Mobile secret boundary");
    expect(check?.status).toBe("pass");
  });

  it("fails for standalone when server env names appear in source", () => {
    const project = standaloneProject({ leakSecret: true });
    const check = runDoctorChecks(project).find((c) => c.name === "Mobile secret boundary");
    expect(check?.status).toBe("fail");
  });

  it("passes for monorepo mobile workspace when no server env names appear", () => {
    const root = mkdtempSync(join(tmpdir(), "expojet-checks-mono-"));
    writeFileSync(
      join(root, "expojet.jsonc"),
      standaloneManifest.replace('"standalone"', '"monorepo"'),
    );
    const mobile = join(root, "apps/mobile");
    mkdirSync(join(mobile, "src"), { recursive: true });
    writeFileSync(join(mobile, "src", "app.tsx"), "export default function App() { return null; }");
    const project = loadProjectContext(root);
    const check = runDoctorChecks(project).find((c) => c.name === "Mobile secret boundary");
    expect(check?.status).toBe("pass");
  });

  it("fails for monorepo mobile workspace when server env names appear", () => {
    const root = mkdtempSync(join(tmpdir(), "expojet-checks-mono-leak-"));
    writeFileSync(
      join(root, "expojet.jsonc"),
      standaloneManifest.replace('"standalone"', '"monorepo"'),
    );
    const mobile = join(root, "apps/mobile");
    mkdirSync(join(mobile, "src"), { recursive: true });
    writeFileSync(join(mobile, "src", "config.ts"), 'export const bad = "BETTER_AUTH_SECRET";');
    const project = loadProjectContext(root);
    const check = runDoctorChecks(project).find((c) => c.name === "Mobile secret boundary");
    expect(check?.status).toBe("fail");
  });
});
