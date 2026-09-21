import { describe, expect, it } from "vitest";
import { appendAuthCreateFlags } from "./create-command-flags.js";

describe("appendAuthCreateFlags", () => {
  it("appends --experimental when Better Auth is selected", () => {
    const flags: string[] = ["--auth better-auth", "--yes"];
    appendAuthCreateFlags(flags, "better-auth");
    expect(flags).toContain("--experimental");
  });

  it("does not append --experimental for stable auth adapters", () => {
    for (const auth of ["clerk", "supabase", "firebase", "none"] as const) {
      const flags: string[] = [`--auth ${auth}`];
      appendAuthCreateFlags(flags, auth);
      expect(flags).not.toContain("--experimental");
    }
  });

  it("appends --socials for Clerk when providers are selected", () => {
    const flags: string[] = [];
    appendAuthCreateFlags(flags, "clerk", ["google", "apple"]);
    expect(flags).toEqual(["--socials google apple"]);
  });
});
