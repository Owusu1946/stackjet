import {
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  renameSync,
  rmdirSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { dirname, join, parse } from "node:path";
import { commandName, manifestFileName } from "@expojet/brand";
import { expojetManifestSchema } from "@expojet/schemas";
import { parse as parseJsonc } from "jsonc-parser";
import { applyPlan, type PlanTarget } from "./apply/plan-applier.js";
import { detectPlanConflicts } from "./conflicts.js";
import { type GenerationPlan, PlanConflictError } from "./operations.js";
import { resolvePlanPath } from "./plan-path.js";

export interface ExecutePlanOptions {
  dryRun?: boolean;
}

export interface PlanExecutionResult {
  destination: string;
  files: string[];
  committed: boolean;
}

const diskTarget = (staging: string): PlanTarget => ({
  write: (path, content) => {
    writeFileSync(resolvePlanPath(staging, path), content, "utf8");
  },
  prepare: (path) => {
    mkdirSync(dirname(resolvePlanPath(staging, path)), { recursive: true });
  },
  copyTree: (from, to) => {
    if (!statSync(from).isDirectory()) throw new Error(`${from} is not a directory`);
    const target = resolvePlanPath(staging, to);
    mkdirSync(dirname(target), { recursive: true });
    cpSync(from, target, { recursive: true, errorOnExist: true });
  },
});

function listFiles(root: string, directory = root): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const absolute = join(directory, entry.name);
    if (entry.isSymbolicLink()) throw new Error(`Symbolic links are not allowed: ${entry.name}`);
    return entry.isDirectory()
      ? listFiles(root, absolute)
      : [absolute.slice(root.length + 1).replaceAll("\\", "/")];
  });
}

function verifyRenderedTree(staging: string) {
  const files = listFiles(staging);
  for (const file of files) {
    const content = readFileSync(resolvePlanPath(staging, file), "utf8");
    if (/\{\{(?:STACKJET|EXPOJET)_[A-Z0-9_]+\}\}/.test(content)) {
      throw new Error(`Unresolved template token in ${file}`);
    }
  }
  const manifestPath = existsSync(resolvePlanPath(staging, manifestFileName))
    ? resolvePlanPath(staging, manifestFileName)
    : resolvePlanPath(staging, "stackjet.jsonc");
  if (existsSync(manifestPath)) {
    const errors: { error: number; offset: number; length: number }[] = [];
    const manifest = parseJsonc(readFileSync(manifestPath, "utf8"), errors);
    if (errors.length > 0) throw new Error(`Generated ${manifestFileName} is invalid JSONC`);
    expojetManifestSchema.parse(manifest);
  }
  return files;
}

// Atomicity comes from the final rename. The target is never cleaned to make generation succeed.
export function executePlan(
  plan: GenerationPlan,
  options: ExecutePlanOptions = {},
): PlanExecutionResult {
  const conflicts = detectPlanConflicts(plan.operations);
  if (conflicts.length > 0) throw new PlanConflictError(conflicts);

  const destination = plan.destination;
  const parent = dirname(destination);
  const prefix = `.${commandName}-${parse(destination).name}-`;
  mkdirSync(parent, { recursive: true });
  const staging = mkdtempSync(join(parent, prefix));
  try {
    applyPlan(plan, diskTarget(staging), (path) => {
      const absolute = resolvePlanPath(staging, path);
      return existsSync(absolute) ? readFileSync(absolute, "utf8") : undefined;
    });
    const files = verifyRenderedTree(staging);
    if (options.dryRun) return { destination, files, committed: false };
    if (existsSync(destination)) {
      if (readdirSync(destination).length > 0)
        throw new Error("Destination became non-empty before commit");
      rmdirSync(destination);
    }
    renameSync(staging, destination);
    return { destination, files, committed: true };
  } finally {
    if (
      existsSync(staging) &&
      dirname(staging) === parent &&
      parse(staging).base.startsWith(prefix)
    ) {
      rmSync(staging, { recursive: true, force: true });
    }
  }
}
