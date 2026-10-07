import { mkdirSync, mkdtempSync, readFileSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  inspectSkillDestination,
  installSkillDirectory,
  skillTreeHash,
  writeSkillRecord,
} from "./skill-files.js";

function setup() {
  const root = mkdtempSync(join(tmpdir(), "skills safe "));
  const source = join(root, "source");
  mkdirSync(source);
  writeFileSync(join(source, "SKILL.md"), "---\nname: demo\ndescription: Example\n---\n");
  return { root, source };
}
describe("safe skills filesystem", () => {
  it("installs atomically and retries without overwriting", () => {
    const { root, source } = setup();
    const destination = join(root, "target");
    expect(installSkillDirectory(source, destination, "demo").status).toBe("installed");
    expect(installSkillDirectory(source, destination, "demo").status).toBe("unchanged");
    writeFileSync(join(destination, "demo", "SKILL.md"), "user changes");
    expect(installSkillDirectory(source, destination, "demo").status).toBe("conflicted");
    expect(readFileSync(join(destination, "demo", "SKILL.md"), "utf8")).toBe("user changes");
  });
  it("rejects traversal and symlinked targets", () => {
    const { root, source } = setup();
    expect(() => installSkillDirectory(source, root, "../escape")).toThrow("Invalid");
    const link = join(root, "link");
    symlinkSync(source, link, process.platform === "win32" ? "junction" : "dir");
    expect(() => inspectSkillDestination(join(link, "demo"))).toThrow("Symlink");
  });
  it("rejects source symlinks and preserves records on unsafe paths", () => {
    const { root, source } = setup();
    symlinkSync(source, join(source, "loop"), process.platform === "win32" ? "junction" : "dir");
    expect(() => skillTreeHash(source)).toThrow("symlinks");
    const record = join(root, "record.json");
    writeSkillRecord(record, "{}");
    expect(readFileSync(record, "utf8")).toBe("{}");
  });
});
