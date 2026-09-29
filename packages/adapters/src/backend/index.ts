import type { BackendAdapter } from "@expojet/schemas";
import type { Adapter } from "../contract.js";
import { convexBackendAdapter } from "./convex.js";
import { expressBackendAdapter } from "./express.js";
import { honoBackendAdapter } from "./hono.js";
import { nestjsBackendAdapter } from "./nestjs.js";
import { noneBackendAdapter } from "./none.js";

export { convexBackendAdapter } from "./convex.js";
export { expressBackendAdapter } from "./express.js";
export { honoBackendAdapter, makeApiEnv } from "./hono.js";
export { nestjsBackendAdapter } from "./nestjs.js";
export { noneBackendAdapter } from "./none.js";

const byId: Record<BackendAdapter, Adapter> = {
  hono: honoBackendAdapter,
  express: expressBackendAdapter,
  nestjs: nestjsBackendAdapter,
  convex: convexBackendAdapter,
  none: noneBackendAdapter,
};

export function backendAdapter(id: BackendAdapter): Adapter {
  return byId[id];
}
