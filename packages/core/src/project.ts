import { existsSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";
import { manifestFileName } from "@expojet/brand";
import { type ExpojetManifest, expojetManifestSchema } from "@expojet/schemas";
import { parse as parseJsonc } from "jsonc-parser";

export interface ProjectContext {
  root: string;
  manifestPath: string;
  manifest: ExpojetManifest;
}

export function loadProjectContext(root: string): ProjectContext | null {
  const primaryPath = join(root, manifestFileName);
  const fallbackPath = join(root, "stackjet.jsonc");
  const manifestPath = existsSync(primaryPath)
    ? primaryPath
    : existsSync(fallbackPath)
      ? fallbackPath
      : null;
  if (!manifestPath) return null;
  const source = readFileSync(manifestPath, "utf8");
  return { root, manifestPath, manifest: expojetManifestSchema.parse(parseJsonc(source)) };
}

export function projectRelativePath(project: ProjectContext, path: string) {
  return relative(project.root, path) || ".";
}
