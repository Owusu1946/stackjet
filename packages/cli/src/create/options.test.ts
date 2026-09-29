import { authAdapters, socialProviders, styleAdapters, supportedSdks } from "@expojet/schemas";
import { describe, expect, it } from "vitest";
import {
  analyticsOptions,
  authOptions,
  databaseOptions,
  iconOptions,
  navigationOptions,
  navigationTypeOptions,
  ormOptions,
  sdkOptions,
  socialOptions,
  stateOptions,
  structureOptions,
  styleOptions,
} from "./options.js";

const values = (options: { value: string | number }[]) => options.map((option) => option.value);

describe("prompt options", () => {
  it("offers every value the schema accepts, each with a label", () => {
    const every = [
      sdkOptions,
      structureOptions,
      navigationOptions,
      navigationTypeOptions,
      iconOptions,
      stateOptions,
      analyticsOptions,
      socialOptions,
    ];
    for (const options of every) {
      for (const option of options) {
        expect(option.label, `no label for ${option.value}`).not.toBe(String(option.value));
      }
    }
    expect(values(sdkOptions)).toEqual([...supportedSdks]);
    expect(values(socialOptions)).toEqual([...socialProviders]);
    expect(values(navigationTypeOptions)).toEqual(["tabs", "drawer", "both", "stack"]);
  });

  it("labels every style adapter rather than falling through to a default", () => {
    expect(values(styleOptions)).toEqual([...styleAdapters]);
  });
});

describe("authOptions", () => {
  it("keeps JWT out of a client-only project, which has no API to sign from", () => {
    const standalone = values(authOptions("standalone", true));
    expect(standalone).not.toContain("jwt");
    expect(standalone).toEqual(["clerk", "supabase", "firebase", "none"]);
  });

  it("hides the experimental provider until it is opted into", () => {
    expect(values(authOptions("monorepo", false))).not.toContain("better-auth");
    expect(values(authOptions("monorepo", true))).toContain("better-auth");
  });

  // JWT is reachable through --auth jwt but is not offered as a prompt choice in
  // either structure. Pinned here so promoting it later is a deliberate change.
  it("does not offer the self-hosted JWT provider as a prompt choice", () => {
    expect(values(authOptions("monorepo", true))).not.toContain("jwt");
    expect(authAdapters).toContain("jwt");
  });
});

describe("databaseOptions", () => {
  it("does not offer Postgres to a client-only project", () => {
    const standalone = values(databaseOptions("standalone"));
    expect(standalone).not.toContain("neon");
    expect(standalone).not.toContain("postgres");
    expect(standalone).toEqual(["none", "sqlite", "supabase"]);
  });

  it("offers the managed and local Postgres choices once there is a server", () => {
    expect(values(databaseOptions("better-auth"))).toEqual(["neon", "supabase", "postgres"]);
    expect(values(databaseOptions("monorepo"))).toEqual([
      "neon",
      "supabase",
      "postgres",
      "sqlite",
      "none",
    ]);
  });
});

describe("ormOptions", () => {
  it("offers Prisma only where a server-side driver can run it", () => {
    expect(values(ormOptions("standalone"))).toEqual(["drizzle", "none"]);
    expect(values(ormOptions("monorepo"))).toEqual(["drizzle", "prisma", "none"]);
  });
});
