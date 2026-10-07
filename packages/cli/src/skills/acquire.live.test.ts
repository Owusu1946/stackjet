import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, it } from "vitest";
import { acquireSkillSource } from "./acquire.js";
import { type SkillSourceId, skillCatalog, skillSources } from "./catalog.js";

// Explicit opt-in: normal CI stays deterministic and never downloads skill repositories.
it
  .skipIf(process.env.EXPOJET_LIVE_SKILLS !== "1")
  .each(Object.keys(skillSources) as SkillSourceId[])(
  "stages the reviewed %s catalog from its exact upstream revision",
  async (source) => {
    const root = mkdtempSync(join(tmpdir(), "expojet-source-smoke-"));
    try {
      const skills = skillCatalog.filter((skill) => skill.source === source);
      const result = await acquireSkillSource(source, skills, root);
      expect([...result.keys()]).toEqual(skills.map((skill) => skill.id));
    } finally {
      rmSync(root, { recursive: true });
    }
  },
  600_000,
);
