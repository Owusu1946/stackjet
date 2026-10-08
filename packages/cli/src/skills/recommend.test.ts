import { describe, expect, it } from "vitest";
import { recommendSkills, type SkillsStack } from "./recommend.js";

const base: SkillsStack = {
  structure: "standalone",
  navigation: "router",
  auth: "none",
  backend: "none",
  database: "none",
  orm: "none",
  style: "stylesheet",
  state: "none",
  analytics: "none",
  monitoring: "none",
  liquidGlass: false,
  eas: false,
};
describe("stack-aware skills", () => {
  it("does not recommend unrelated integrations", () => {
    const { skills } = recommendSkills(base);
    expect(skills.map((s) => s.id)).toContain("expo-router");
    expect(skills.every((s) => s.source === "expo")).toBe(true);
    expect(skills.some((s) => s.condition === "eas" || s.condition === "glass")).toBe(false);
  });
  it.each(["standalone", "monorepo", "monorepo-web"] as const)(
    "matches navigation and features in %s",
    (structure) => {
      const { skills, gaps } = recommendSkills({
        ...base,
        structure,
        navigation: "react-navigation",
        eas: true,
        liquidGlass: true,
      });
      expect(skills.map((s) => s.id)).not.toContain("expo-router");
      expect(skills.map((s) => s.id)).toContain("expo-ui");
      expect(skills.map((s) => s.id)).toContain("eas-workflows");
      expect(gaps).toContain("React Navigation-specific guidance");
    },
  );
  it("selects backend, auth and database skills independently", () => {
    const { skills } = recommendSkills({
      ...base,
      structure: "monorepo-web",
      backend: "hono",
      auth: "clerk",
      database: "neon",
      orm: "prisma",
    });
    expect(skills.map((s) => s.id)).toEqual(
      expect.arrayContaining([
        "hono",
        "clerk-expo",
        "clerk-nextjs-patterns",
        "neon-postgres",
        "prisma-cli",
        "next-dev-loop",
      ]),
    );
  });
});
