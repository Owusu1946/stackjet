import { applyEdits, modify } from "jsonc-parser";
import { composeAppPlugins, composeMetroConfig } from "./compose.js";
import { detectPlanConflicts } from "./conflicts.js";
import {
  type GenerationPlan,
  type JsonEdit,
  type JsonValue,
  PlanConflictError,
} from "./operations.js";

export interface MaterializedFile {
  path: string;
  content: string;
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

function packagePath(workspace: string) {
  return workspace === "." ? "package.json" : `${workspace}/package.json`;
}

function parsePackage(files: Map<string, string>, workspace: string) {
  const path = packagePath(workspace);
  const content = files.get(path);
  if (content === undefined) throw new Error(`Plan references missing file: ${path}`);
  return { path, data: JSON.parse(content) as Record<string, JsonValue> };
}

function writeJson(files: Map<string, string>, path: string, value: unknown) {
  files.set(path, `${JSON.stringify(value, null, 2)}\n`);
}

/** Materialize a generation plan in memory using the same operation semantics as the disk executor. */
export function materializePlan(plan: GenerationPlan): MaterializedFile[] {
  const conflicts = detectPlanConflicts(plan.operations);
  if (conflicts.length > 0) throw new PlanConflictError(conflicts);

  const files = new Map<string, string>();
  const metro = new Map<string, Parameters<typeof composeMetroConfig>[0]>();
  const appPlugins = new Map<string, Parameters<typeof composeAppPlugins>[0]>();

  for (const operation of plan.operations) {
    switch (operation.type) {
      case "write-file":
        files.set(operation.path, operation.content);
        break;
      case "copy-tree":
        throw new Error("In-memory previews do not support copy-tree operations");
      case "patch-json":
      case "patch-jsonc": {
        const original = files.get(operation.path);
        if (original === undefined)
          throw new Error(`Plan references missing file: ${operation.path}`);
        files.set(
          operation.path,
          updateJsonText(original, operation.edits, operation.type === "patch-jsonc"),
        );
        break;
      }
      case "add-dependency": {
        const { path, data } = parsePackage(files, operation.workspace);
        const section = (data[operation.kind] ?? {}) as Record<string, JsonValue>;
        section[operation.name] = operation.version;
        data[operation.kind] = Object.fromEntries(
          Object.entries(section).sort(([a], [b]) => a.localeCompare(b)),
        );
        writeJson(files, path, data);
        break;
      }
      case "add-script": {
        const { path, data } = parsePackage(files, operation.workspace);
        const scripts = (data.scripts ?? {}) as Record<string, JsonValue>;
        scripts[operation.name] = operation.command;
        data.scripts = Object.fromEntries(
          Object.entries(scripts).sort(([a], [b]) => a.localeCompare(b)),
        );
        writeJson(files, path, data);
        break;
      }
      case "add-env": {
        const prefix = operation.workspace === "." ? "" : `${operation.workspace}/`;
        const path = `${prefix}.env.example`;
        const description = operation.variable.description
          ? `# ${operation.variable.description}\n`
          : "";
        files.set(path, `${files.get(path) ?? ""}${description}${operation.variable.name}=\n`);
        break;
      }
      case "compose-metro": {
        const workspace = operation.contribution.workspace ?? ".";
        metro.set(workspace, [...(metro.get(workspace) ?? []), operation.contribution]);
        break;
      }
      case "compose-app-config": {
        const workspace = operation.contribution.workspace ?? ".";
        appPlugins.set(workspace, [...(appPlugins.get(workspace) ?? []), operation.contribution]);
        break;
      }
    }
  }

  for (const [workspace, contributions] of metro) {
    const prefix = workspace === "." ? "" : `${workspace}/`;
    files.set(`${prefix}metro.config.js`, composeMetroConfig(contributions));
  }
  for (const [workspace, contributions] of appPlugins) {
    const prefix = workspace === "." ? "" : `${workspace}/`;
    const path = `${prefix}app.json`;
    const content = files.get(path);
    if (content === undefined) throw new Error(`Plan references missing file: ${path}`);
    const data = JSON.parse(content) as { expo?: Record<string, unknown> };
    data.expo ??= {};
    const existing = Array.isArray(data.expo.plugins) ? data.expo.plugins : [];
    data.expo.plugins = [...existing, ...composeAppPlugins(contributions)];
    writeJson(files, path, data);
  }

  return [...files.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([path, content]) => ({ path, content }));
}
