export type DependencyKind = "dependencies" | "devDependencies";

export interface EnvVariableDefinition {
  name: string;
  classification: "public" | "server-secret" | "device-secret";
  description?: string;
}

export interface MetroContribution {
  id: string;
  workspace?: string;
  module: string;
  exportName: string;
  options?: unknown;
}

export interface AppConfigContribution {
  workspace?: string;
  plugin: string;
  options?: unknown;
}

export type JsonValue =
  | null
  | boolean
  | number
  | string
  | JsonValue[]
  | { [key: string]: JsonValue };

export interface JsonEdit {
  path: (string | number)[];
  value: JsonValue | undefined;
}

export type Operation =
  | { type: "write-file"; path: string; content: string; owner: string }
  | { type: "copy-tree"; from: string; to: string; owner: string }
  | { type: "patch-json"; path: string; edits: JsonEdit[]; owner: string }
  | { type: "patch-jsonc"; path: string; edits: JsonEdit[]; owner: string }
  | {
      type: "add-dependency";
      workspace: string;
      name: string;
      version: string;
      kind: DependencyKind;
      owner: string;
    }
  | { type: "add-env"; workspace: string; variable: EnvVariableDefinition; owner: string }
  | { type: "add-script"; workspace: string; name: string; command: string; owner: string }
  | { type: "compose-metro"; contribution: MetroContribution; owner: string }
  | { type: "compose-app-config"; contribution: AppConfigContribution; owner: string };

export interface GenerationPlan {
  destination: string;
  operations: Operation[];
}

export interface PlanConflict {
  key: string;
  message: string;
  owners: string[];
}

export class PlanConflictError extends Error {
  override name = "PlanConflictError";
  constructor(readonly conflicts: PlanConflict[]) {
    super(conflicts.map((conflict) => conflict.message).join("; "));
  }
}
