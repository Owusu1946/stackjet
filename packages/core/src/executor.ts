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
import { stackjetManifestSchema } from "@stackjet/schemas";
import { applyEdits, modify, parse as parseJsonc } from "jsonc-parser";
import { composeAppPlugins, composeMetroConfig } from "./compose.js";
import { detectPlanConflicts } from "./conflicts.js";
import {
  type GenerationPlan,
  type JsonEdit,
  type JsonValue,
  PlanConflictError,
} from "./operations.js";
import { resolvePlanPath } from "./plan-path.js";

export interface ExecutePlanOptions {
  dryRun?: boolean;
}

export interface PlanExecutionResult {
  destination: string;
  files: string[];
  committed: boolean;
}

function updateJsonText(text: string, edits: JsonEdit[], jsonc: boolean) {
  let current = text;
  for (const edit of edits) {
    current = applyEdits(
      current,
      modify(current, edit.path, edit.value, {
        formattingOptions: { insertSpaces: true, tabSize: 2, eol: "\n" },
      }),
    );
  }
  if (!jsonc) JSON.parse(current);
  return current.endsWith("\n") ? current : `${current}\n`;
}

function readPackage(staging: string, workspace: string) {
  const relative = workspace === "." ? "package.json" : `${workspace}/package.json`;
  const path = resolvePlanPath(staging, relative);
  const data = JSON.parse(readFileSync(path, "utf8")) as Record<string, JsonValue>;
  return { path, data };
}

function writeJson(path: string, value: unknown) {
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function renderPlan(plan: GenerationPlan, staging: string) {
  const metro = new Map<string, Parameters<typeof composeMetroConfig>[0]>();
  const appPlugins = new Map<string, Parameters<typeof composeAppPlugins>[0]>();
  for (const operation of plan.operations) {
    switch (operation.type) {
      case "write-file": {
        const path = resolvePlanPath(staging, operation.path);
        mkdirSync(dirname(path), { recursive: true });
        writeFileSync(path, operation.content, "utf8");
        break;
      }
      case "copy-tree": {
        const target = resolvePlanPath(staging, operation.to);
        if (!statSync(operation.from).isDirectory())
          throw new Error(`${operation.from} is not a directory`);
        mkdirSync(dirname(target), { recursive: true });
        cpSync(operation.from, target, { recursive: true, errorOnExist: true });
        break;
      }
      case "patch-json":
      case "patch-jsonc": {
        const path = resolvePlanPath(staging, operation.path);
        const original = readFileSync(path, "utf8");
        writeFileSync(
          path,
          updateJsonText(original, operation.edits, operation.type === "patch-jsonc"),
        );
        break;
      }
      case "add-dependency": {
        const { path, data } = readPackage(staging, operation.workspace);
        const section = (data[operation.kind] ?? {}) as Record<string, JsonValue>;
        section[operation.name] = operation.version;
        data[operation.kind] = Object.fromEntries(
          Object.entries(section).sort(([a], [b]) => a.localeCompare(b)),
        );
        writeJson(path, data);
        break;
      }
      case "add-script": {
        const { path, data } = readPackage(staging, operation.workspace);
        const scripts = (data.scripts ?? {}) as Record<string, JsonValue>;
        scripts[operation.name] = operation.command;
        data.scripts = Object.fromEntries(
          Object.entries(scripts).sort(([a], [b]) => a.localeCompare(b)),
        );
        writeJson(path, data);
        break;
      }
      case "add-env": {
        const workspace = operation.workspace === "." ? "" : `${operation.workspace}/`;
        const path = resolvePlanPath(staging, `${workspace}.env.example`);
        mkdirSync(dirname(path), { recursive: true });
        const existing = existsSync(path) ? readFileSync(path, "utf8") : "";
        const description = operation.variable.description
          ? `# ${operation.variable.description}\n`
          : "";
        writeFileSync(path, `${existing}${description}${operation.variable.name}=\n`, "utf8");
        break;
      }
      case "compose-metro":
        metro.set(operation.contribution.workspace ?? ".", [
          ...(metro.get(operation.contribution.workspace ?? ".") ?? []),
          operation.contribution,
        ]);
        break;
      case "compose-app-config":
        appPlugins.set(operation.contribution.workspace ?? ".", [
          ...(appPlugins.get(operation.contribution.workspace ?? ".") ?? []),
          operation.contribution,
        ]);
        break;
    }
  }
  for (const [workspace, contributions] of metro) {
    const prefix = workspace === "." ? "" : `${workspace}/`;
    writeFileSync(
      resolvePlanPath(staging, `${prefix}metro.config.js`),
      composeMetroConfig(contributions),
      "utf8",
    );
  }
  for (const [workspace, contributions] of appPlugins) {
    const prefix = workspace === "." ? "" : `${workspace}/`;
    const path = resolvePlanPath(staging, `${prefix}app.json`);
    const data = JSON.parse(readFileSync(path, "utf8")) as { expo?: Record<string, unknown> };
    data.expo ??= {};
    const existing = Array.isArray(data.expo.plugins) ? data.expo.plugins : [];
    data.expo.plugins = [...existing, ...composeAppPlugins(contributions)];
    writeJson(path, data);
  }
}

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
    if (/\{\{STACKJET_[A-Z0-9_]+\}\}/.test(content)) {
      throw new Error(`Unresolved template token in ${file}`);
    }
  }
  const manifestPath = resolvePlanPath(staging, "stackjet.jsonc");
  if (existsSync(manifestPath)) {
    const errors: { error: number; offset: number; length: number }[] = [];
    const manifest = parseJsonc(readFileSync(manifestPath, "utf8"), errors);
    if (errors.length > 0) throw new Error("Generated stackjet.jsonc is invalid JSONC");
    stackjetManifestSchema.parse(manifest);
  }
  return files;
}

export function executePlan(
  plan: GenerationPlan,
  options: ExecutePlanOptions = {},
): PlanExecutionResult {
  const conflicts = detectPlanConflicts(plan.operations);
  if (conflicts.length > 0) throw new PlanConflictError(conflicts);

  const destination = plan.destination;
  const parent = dirname(destination);
  const prefix = `.stackjet-${parse(destination).name}-`;
  mkdirSync(parent, { recursive: true });
  const staging = mkdtempSync(join(parent, prefix));
  try {
    renderPlan(plan, staging);
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
