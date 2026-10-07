import { mkdirSync, mkdtempSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { skillCatalog } from "./catalog.js";
import { type AcquireSkills, installSelectedSkills } from "./install.js";

const acquire: AcquireSkills = async (_source, skills, workspace) => {
  const staged = new Map<string, string>();
  for (const skill of skills) {
    const directory = join(workspace, skill.id);
    mkdirSync(directory);
    writeFileSync(
      join(directory, "SKILL.md"),
      `---\nname: ${skill.name}\ndescription: Guidance\n---\n`,
    );
    staged.set(skill.id, directory);
  }
  return staged;
};

describe("recoverable skills installation", () => {
  afterEach(() => vi.unstubAllEnvs());
  it("global installs leave the project untouched and keep records outside it", async () => {
    const root = mkdtempSync(join(tmpdir(), "skills-global-"));
    const project = join(root, "app");
    mkdirSync(project);
    writeFileSync(join(project, "user.txt"), "unchanged");
    vi.stubEnv("EXPOJET_CONFIG_DIR", join(root, "records"));
    const result = await installSelectedSkills(
      {
        project,
        scope: "global",
        skills: skillCatalog.slice(0, 1),
        targets: [{ root: join(root, "global-agent/skills"), agents: ["codex"] }],
      },
      undefined,
      acquire,
    );
    expect(result.outcomes[0]?.status).toBe("installed");
    expect(readdirSync(project)).toEqual(["user.txt"]);
    expect(readFileSync(join(project, "user.txt"), "utf8")).toBe("unchanged");
    expect(readdirSync(join(root, "records"))).toContain("expojet-skills.lock.json");
  });
  it("cancellation after one source keeps successful installs and their record", async () => {
    const project = mkdtempSync(join(tmpdir(), "skills-cancel-partial-"));
    const controller = new AbortController();
    const skills = skillCatalog.filter(
      (skill) => skill.id === "expo-overview" || skill.id === "hono",
    );
    const result = await installSelectedSkills(
      {
        project,
        scope: "project",
        skills,
        targets: [{ root: join(project, ".agents/skills"), agents: ["codex"] }],
      },
      controller.signal,
      async (...args) => {
        if (args[0] === "hono") {
          controller.abort();
          throw new Error("cancelled");
        }
        return acquire(...args);
      },
    );
    expect(result.cancelled).toBe(true);
    expect(result.outcomes.map((outcome) => outcome.status)).toEqual(["installed"]);
    expect(readFileSync(join(project, "expojet-skills.lock.json"), "utf8")).toContain(
      "expo-overview",
    );
  });
  it("installs, retries idempotently, and preserves edited skills", async () => {
    const project = mkdtempSync(join(tmpdir(), "skills install spaces "));
    const skill = skillCatalog[0];
    if (!skill) throw new Error("Empty catalog");
    const root = join(project, ".agents", "skills");
    const request = {
      project,
      scope: "project" as const,
      skills: [skill],
      targets: [{ root, agents: ["codex" as const] }],
    };
    expect((await installSelectedSkills(request, undefined, acquire)).outcomes[0]?.status).toBe(
      "installed",
    );
    expect((await installSelectedSkills(request, undefined, acquire)).outcomes[0]?.status).toBe(
      "unchanged",
    );
    const file = join(root, skill.name, "SKILL.md");
    writeFileSync(file, "user edits");
    expect((await installSelectedSkills(request, undefined, acquire)).outcomes[0]?.status).toBe(
      "conflicted",
    );
    expect(readFileSync(file, "utf8")).toBe("user edits");
  });

  it("continues independent sources after an offline failure", async () => {
    const project = mkdtempSync(join(tmpdir(), "skills-partial-"));
    const selected = skillCatalog.filter(
      (skill) => skill.id === "expo-overview" || skill.id === "hono",
    );
    const result = await installSelectedSkills(
      {
        project,
        scope: "project",
        skills: selected,
        targets: [{ root: join(project, ".agents/skills"), agents: ["codex"] }],
      },
      undefined,
      async (...args) => {
        if (args[0] === "expo") throw new Error("offline");
        return acquire(...args);
      },
    );
    expect(result.outcomes.map((outcome) => outcome.status)).toEqual(["failed", "installed"]);
  });

  it("cancellation before acquisition does not install anything", async () => {
    const project = mkdtempSync(join(tmpdir(), "skills-cancel-"));
    const controller = new AbortController();
    controller.abort();
    const result = await installSelectedSkills(
      {
        project,
        scope: "project",
        skills: skillCatalog.slice(0, 1),
        targets: [{ root: join(project, ".agents/skills"), agents: ["codex"] }],
      },
      controller.signal,
      async () => {
        throw new Error("Must not acquire");
      },
    );
    expect(result).toEqual({ outcomes: [], cancelled: true });
  });
});
