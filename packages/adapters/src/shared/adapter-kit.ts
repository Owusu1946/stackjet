import { productName } from "@expojet/brand";
import { z } from "zod";

/**
 * Shared helpers for writing adapters.
 *
 * An adapter's `plan` decides which files to emit; the sources it emits come from template
 * literals. Both kinds live in the same module, so these helpers exist to keep the decision half
 * short enough to read at a glance.
 */

/** Options schema for an adapter that takes no configuration. */
export const noOptions = z.object({}).strict();

/** `EXPOJET`, for headings inside generated screens. */
export const brandTitle = productName.toUpperCase();

export interface MobileLocation {
  /** Workspace the operation targets: `.` for standalone, `apps/mobile` otherwise. */
  workspace: string;
  /** Same, as a path prefix. Empty for standalone. */
  root: string;
}

export function mobileLocation(
  structure: "standalone" | "monorepo" | "monorepo-web",
): MobileLocation {
  const workspace = structure === "standalone" ? "." : "apps/mobile";
  return { workspace, root: workspace === "." ? "" : `${workspace}/` };
}
