import type { Operation, PlanConflict } from "./operations.js";

function sameValue(left: unknown, right: unknown) {
  return JSON.stringify(left) === JSON.stringify(right);
}

export function detectPlanConflicts(operations: Operation[]): PlanConflict[] {
  const claims = new Map<string, { owner: string; value: unknown }>();
  const conflicts: PlanConflict[] = [];

  const claim = (key: string, owner: string, value: unknown, label: string) => {
    const existing = claims.get(key);
    if (!existing) {
      claims.set(key, { owner, value });
      return;
    }
    if (existing.owner !== owner && !sameValue(existing.value, value)) {
      conflicts.push({
        key,
        message: `${label} is claimed incompatibly by ${existing.owner} and ${owner}`,
        owners: [existing.owner, owner],
      });
    }
  };

  for (const operation of operations) {
    switch (operation.type) {
      case "write-file":
        claim(`file:${operation.path}`, operation.owner, operation.content, operation.path);
        break;
      case "copy-tree":
        claim(`tree:${operation.to}`, operation.owner, operation.from, operation.to);
        break;
      case "add-dependency":
        claim(
          `dependency:${operation.workspace}:${operation.name}`,
          operation.owner,
          { version: operation.version, kind: operation.kind },
          `Dependency ${operation.name}`,
        );
        break;
      case "add-env":
        claim(
          `env:${operation.workspace}:${operation.variable.name}`,
          operation.owner,
          operation.variable.classification,
          `Environment variable ${operation.variable.name}`,
        );
        break;
      case "add-script":
        claim(
          `script:${operation.workspace}:${operation.name}`,
          operation.owner,
          operation.command,
          `Script ${operation.name}`,
        );
        break;
      default:
        break;
    }
  }
  return conflicts;
}
