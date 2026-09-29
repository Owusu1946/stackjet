import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import type { ProjectContext } from "../project.js";

// Only `EXPO_PUBLIC_` names are safe to inline into a bundle, so everything else is classified as
// a server secret.
export interface EnvCheckResult {
  workspace: string;
  variable: string;
  classification: "mobile-public" | "server-secret";
  status: "present" | "missing";
}

export function workspacesFor(structure: string): string[] {
  if (structure === "monorepo-web") return ["apps/mobile", "apps/api", "apps/web"];
  if (structure === "monorepo") return ["apps/mobile", "apps/api"];
  return ["."];
}

function variableNames(source: string) {
  return new Set(
    source
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith("#") && line.includes("="))
      .map((line) => line.slice(0, line.indexOf("="))),
  );
}

export function checkEnvironment(project: ProjectContext): EnvCheckResult[] {
  return workspacesFor(project.manifest.structure).flatMap((workspace) => {
    const directory = workspace === "." ? project.root : join(project.root, workspace);
    const examplePath = join(directory, ".env.example");
    if (!existsSync(examplePath)) return [];

    const required = variableNames(readFileSync(examplePath, "utf8"));
    const actualPath = join(directory, ".env");
    const actual = existsSync(actualPath)
      ? variableNames(readFileSync(actualPath, "utf8"))
      : new Set<string>();

    return [...required].map((variable) => ({
      workspace,
      variable,
      classification: variable.startsWith("EXPO_PUBLIC_")
        ? ("mobile-public" as const)
        : ("server-secret" as const),
      status: actual.has(variable) ? ("present" as const) : ("missing" as const),
    }));
  });
}
