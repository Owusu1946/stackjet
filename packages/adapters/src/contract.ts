import type { Operation } from "@expojet/core";
import type { CreateInput } from "@expojet/schemas";
import type { z } from "zod";

export interface CapabilityDeclaration {
  sdk: readonly number[];
  requires: readonly string[];
  conflicts: readonly string[];
}

export interface Adapter<TOptions extends object = object> {
  readonly id: string;
  readonly version: string;
  readonly kind:
    | "auth"
    | "style"
    | "api"
    | "database"
    | "orm"
    | "feature"
    | "navigation"
    | "icons"
    | "state"
    | "liquid-glass"
    | "analytics";
  readonly displayName: string;
  capabilities(): CapabilityDeclaration;
  optionsSchema(): z.ZodType<TOptions>;
  plan(input: CreateInput, options: TOptions): Operation[];
}
