import { applyEdits, modify } from "jsonc-parser";
import { composeAppPlugins, composeMetroConfig } from "../compose.js";
import type {
  AppConfigContribution,
  GenerationPlan,
  JsonEdit,
  JsonValue,
  MetroContribution,
  Operation,
} from "../operations.js";

// Two targets exist and must agree exactly: the disk executor and the in-memory preview. Divergence
// means the Stack Builder shows a project the generator would not produce.
export interface PlanTarget {
  write(path: string, content: string): void;
  prepare(path: string): void;
  copyTree(from: string, to: string): void;
}

const jsonFormatting = { insertSpaces: true, tabSize: 2, eol: "\n" } as const;

function applyJsonEdits(text: string, edits: JsonEdit[], jsonc: boolean) {
  let current = text;
  for (const edit of edits) {
    current = applyEdits(
      current,
      modify(current, edit.path, edit.value, { formattingOptions: jsonFormatting }),
    );
  }
  if (!jsonc) JSON.parse(current);
  return current.endsWith("\n") ? current : `${current}\n`;
}

const workspacePrefix = (workspace: string) => (workspace === "." ? "" : `${workspace}/`);

function packageJsonPath(workspace: string) {
  return `${workspacePrefix(workspace)}package.json`;
}

/**
 * One cache key per file on disk. Operations spell paths interchangeably --
 * `./package.json` and `package.json` reach the same file -- so a cache keyed on
 * the raw string would hand back contents the plan had already superseded.
 */
function cacheKey(path: string) {
  const normalized = path.replaceAll("\\", "/").replace(/\/{2,}/g, "/");
  return normalized.replace(/^\.\//, "").replace(/\/+$/, "");
}

/** Whether `path` is `root` itself or something the copy placed underneath it. */
function isWithin(root: string, path: string) {
  if (root === "" || root === ".") return true;
  return path === root || path.startsWith(`${root}/`);
}

// Sorted so output does not depend on the order adapters ran in.
function sortSection(section: Record<string, JsonValue>) {
  return Object.fromEntries(Object.entries(section).sort(([a], [b]) => a.localeCompare(b)));
}

// Composition operations are collected, not written on arrival: `metro.config.js` and
// `expo.plugins` each depend on every contribution in the plan, so they are flushed at the end.
export class PlanApplier {
  private readonly metro = new Map<string, MetroContribution[]>();
  private readonly appPlugins = new Map<string, AppConfigContribution[]>();
  private readonly texts = new Map<string, string>();

  constructor(
    private readonly target: PlanTarget,
    /** Reads files the plan did not write itself, e.g. a `copy-tree` payload on disk. */
    private readonly onRead: (path: string) => string | undefined = () => undefined,
  ) {}

  private read(path: string): string {
    const key = cacheKey(path);
    const staged = this.texts.get(key);
    if (staged !== undefined) return staged;
    const fromTarget = this.onRead(path);
    if (fromTarget === undefined) throw new Error(`Plan references missing file: ${path}`);
    this.texts.set(key, fromTarget);
    return fromTarget;
  }

  /** `add-env` may create `.env.example` rather than extend one. */
  private readOptional(path: string): string | undefined {
    return this.texts.get(cacheKey(path)) ?? this.onRead(path);
  }

  private write(path: string, content: string) {
    this.texts.set(cacheKey(path), content);
    this.target.prepare(path);
    this.target.write(path, content);
  }

  private readPackageJson(workspace: string) {
    const path = packageJsonPath(workspace);
    return { path, data: JSON.parse(this.read(path)) as Record<string, JsonValue> };
  }

  private writeJson(path: string, value: unknown) {
    this.write(path, `${JSON.stringify(value, null, 2)}\n`);
  }

  apply(operation: Operation) {
    switch (operation.type) {
      case "write-file":
        this.write(operation.path, operation.content);
        break;

      case "copy-tree":
        this.target.copyTree(operation.from, operation.to);
        this.invalidateUnder(operation.to);
        break;

      case "patch-json":
      case "patch-jsonc":
        this.write(
          operation.path,
          applyJsonEdits(
            this.read(operation.path),
            operation.edits,
            operation.type === "patch-jsonc",
          ),
        );
        break;

      case "add-dependency": {
        const { path, data } = this.readPackageJson(operation.workspace);
        const section = (data[operation.kind] ?? {}) as Record<string, JsonValue>;
        section[operation.name] = operation.version;
        data[operation.kind] = sortSection(section);
        this.writeJson(path, data);
        break;
      }

      case "add-script": {
        const { path, data } = this.readPackageJson(operation.workspace);
        const scripts = (data.scripts ?? {}) as Record<string, JsonValue>;
        scripts[operation.name] = operation.command;
        data.scripts = sortSection(scripts);
        this.writeJson(path, data);
        break;
      }

      case "add-env": {
        const path = `${workspacePrefix(operation.workspace)}.env.example`;
        const description = operation.variable.description
          ? `# ${operation.variable.description}\n`
          : "";
        this.write(
          path,
          `${this.readOptional(path) ?? ""}${description}${operation.variable.name}=\n`,
        );
        break;
      }

      case "compose-metro":
        this.collect(this.metro, operation.contribution.workspace, operation.contribution);
        break;

      case "compose-app-config":
        this.collect(this.appPlugins, operation.contribution.workspace, operation.contribution);
        break;
    }
  }

  private collect<T>(into: Map<string, T[]>, workspace: string | undefined, contribution: T) {
    const key = workspace ?? ".";
    into.set(key, [...(into.get(key) ?? []), contribution]);
  }

  /**
   * A copy overwrites whatever was there, so anything the plan read before it is
   * no longer what is on disk. Dropping the entry is enough: the next read goes
   * back to the target and picks up the copied bytes.
   */
  private invalidateUnder(destination: string) {
    const root = cacheKey(destination);
    for (const key of this.texts.keys()) {
      if (isWithin(root, key)) this.texts.delete(key);
    }
  }

  finish() {
    for (const [workspace, contributions] of this.metro) {
      this.write(`${workspacePrefix(workspace)}metro.config.js`, composeMetroConfig(contributions));
    }
    for (const [workspace, contributions] of this.appPlugins) {
      const path = `${workspacePrefix(workspace)}app.json`;
      const data = JSON.parse(this.read(path)) as { expo?: Record<string, unknown> };
      data.expo ??= {};
      const existing = Array.isArray(data.expo.plugins) ? data.expo.plugins : [];
      data.expo.plugins = [...existing, ...composeAppPlugins(contributions)];
      this.writeJson(path, data);
    }
  }
}

export function applyPlan(
  plan: GenerationPlan,
  target: PlanTarget,
  onRead: (path: string) => string | undefined = () => undefined,
) {
  const applier = new PlanApplier(target, onRead);
  for (const operation of plan.operations) applier.apply(operation);
  applier.finish();
}
