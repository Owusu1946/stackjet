import type { Adapter } from "../contract.js";
import { noOptions } from "../shared/adapter-kit.js";

// ---------------------------------------------------------------------------
// Shared Environment Template
// ---------------------------------------------------------------------------

export const noneBackendAdapter: Adapter = {
  id: "backend:none",
  version: "1.0.0",
  kind: "api",
  displayName: "No Backend",
  capabilities: () => ({ sdk: [57, 58], requires: [], conflicts: [] }),
  optionsSchema: () => noOptions,
  plan() {
    return [];
  },
};
