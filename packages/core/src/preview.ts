import { applyPlan, type PlanTarget } from "./apply/plan-applier.js";
import { detectPlanConflicts } from "./conflicts.js";
import { type GenerationPlan, PlanConflictError } from "./operations.js";

export interface MaterializedFile {
  path: string;
  content: string;
}

/**
 * Renders a generation plan entirely in memory, using the same operation semantics as the disk
 * executor. This is what the docs Stack Builder previews, so it must stay in step with
 * `executePlan` by construction rather than by discipline — both go through {@link applyPlan}.
 */
export function materializePlan(plan: GenerationPlan): MaterializedFile[] {
  const conflicts = detectPlanConflicts(plan.operations);
  if (conflicts.length > 0) throw new PlanConflictError(conflicts);

  const files = new Map<string, string>();
  const target: PlanTarget = {
    write: (path, content) => {
      files.set(path, content);
    },
    prepare: () => {},
    copyTree: () => {
      throw new Error("In-memory previews do not support copy-tree operations");
    },
  };

  applyPlan(plan, target, (path) => files.get(path));

  return [...files.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([path, content]) => ({ path, content }));
}
