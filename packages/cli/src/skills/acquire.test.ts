import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { validateSkillMetadata } from "./acquire.js";
import { skillCatalog, skillSources } from "./catalog.js";

describe("reviewed skill sources", () => {
  it("pins every source and keeps names unique", () => {
    expect(new Set(skillCatalog.map((s) => s.id)).size).toBe(skillCatalog.length);
    for (const source of Object.values(skillSources))
      expect(source.commit).toMatch(/^[a-f0-9]{40}$/);
  });
  it("requires the selected name and a description", () => {
    const directory = mkdtempSync(join(tmpdir(), "skill-metadata-"));
    const skill = skillCatalog.find((s) => s.id === "expo-overview");
    if (!skill) throw new Error("Missing catalog entry");
    writeFileSync(join(directory, "SKILL.md"), "---\nname: unrelated\ndescription: Example\n---\n");
    expect(() => validateSkillMetadata(directory, skill)).toThrow("metadata");
    writeFileSync(
      join(directory, "SKILL.md"),
      "---\nname: expo-overview\ndescription: >\n  Multiline description\n---\n",
    );
    mkdirSync(join(directory, "references"));
    writeFileSync(join(directory, "references", "guide.md"), "example");
    expect(validateSkillMetadata(directory, skill)).toMatch(/^[a-f0-9]{64}$/);
  });
});
