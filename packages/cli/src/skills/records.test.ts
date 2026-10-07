import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { readSkillsRecord, saveSkillsRecords } from "./records.js";

describe("skills installation records", () => {
  it("merges successful destinations and agent attribution", () => {
    const path = join(mkdtempSync(join(tmpdir(), "skills-record-")), "record.json");
    const entry = {
      skill: "hono",
      repository: "honojs/skills",
      commit: "a".repeat(40),
      hash: "b".repeat(64),
      destination: ".agents/skills/hono",
      agents: ["codex"] as const,
      provenance: "official" as const,
    };
    saveSkillsRecords(path, [{ ...entry, agents: [...entry.agents] }]);
    saveSkillsRecords(path, [{ ...entry, agents: ["cursor"] }]);
    expect(readSkillsRecord(path).entries[0]?.agents).toEqual(["codex", "cursor"]);
    expect(readFileSync(path, "utf8")).not.toContain("createdAt");
  });
  it("does not erase a corrupt record", () => {
    const path = join(mkdtempSync(join(tmpdir(), "skills-record-")), "record.json");
    writeFileSync(path, "user content");
    expect(() => saveSkillsRecords(path, [])).toThrow();
    expect(readFileSync(path, "utf8")).toBe("user content");
  });
  it("preserves another process's record lock", () => {
    const path = join(mkdtempSync(join(tmpdir(), "skills-record-lock-")), "record.json");
    writeFileSync(`${path}.install-lock`, "another installer");
    expect(() => saveSkillsRecords(path, [])).toThrow();
    expect(readFileSync(`${path}.install-lock`, "utf8")).toBe("another installer");
  });
});
