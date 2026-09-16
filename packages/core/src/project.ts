import { existsSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";
import { type StackjetManifest, stackjetManifestSchema } from "@stackjet/schemas";
import { parse as parseJsonc } from "jsonc-parser";

export interface ProjectContext {
  root: string;
  manifestPath: string;
  manifest: StackjetManifest;
}

export function loadProjectContext(root: string): ProjectContext | null {
  const manifestPath = join(root, "stackjet.jsonc");
  if (!existsSync(manifestPath)) return null;
  const source = readFileSync(manifestPath, "utf8");
  return { root, manifestPath, manifest: stackjetManifestSchema.parse(parseJsonc(source)) };
}

export function projectRelativePath(project: ProjectContext, path: string) {
  return relative(project.root, path) || ".";
}
