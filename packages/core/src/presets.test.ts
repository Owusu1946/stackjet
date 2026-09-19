import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  deletePreset,
  getPreset,
  getPresetSync,
  getPresetsDirectory,
  getPresetsFilePath,
  listPresets,
  loadPresets,
  loadPresetsSync,
  savePreset,
  savePresetSync,
} from "./presets.js";

describe("presets engine", () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "expojet-presets-test-"));
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  it("resolves presets file path inside directory", () => {
    expect(getPresetsDirectory(tempDir)).toBe(tempDir);
    expect(getPresetsFilePath(tempDir)).toBe(path.join(tempDir, "presets.json"));
  });

  it("returns empty array when presets file does not exist", async () => {
    const presets = await loadPresets(tempDir);
    expect(presets).toEqual([]);
  });

  it("saves and retrieves a valid preset", async () => {
    const preset = {
      name: "starter-neon",
      description: "Hono + Neon monorepo with Zustand",
      createdAt: "2026-09-19T10:00:00.000Z",
      config: {
        structure: "monorepo" as const,
        packageManager: "pnpm" as const,
        navigation: "router" as const,
        navigationType: "tabs" as const,
        backend: "hono" as const,
        auth: "clerk" as const,
        style: "uniwind" as const,
        database: "neon" as const,
        orm: "drizzle" as const,
        icons: "lucide" as const,
        state: "zustand" as const,
        liquidGlass: true,
        analytics: "none" as const,
      },
    };

    await savePreset(preset, tempDir);

    const loaded = await loadPresets(tempDir);
    expect(loaded).toHaveLength(1);
    expect(loaded[0]?.name).toBe("starter-neon");
    expect(loaded[0]?.config.database).toBe("neon");
    expect(loaded[0]?.config.state).toBe("zustand");
    expect(loaded[0]?.config.liquidGlass).toBe(true);

    const single = await getPreset("STARTER-NEON", tempDir);
    expect(single).toBeDefined();
    expect(single?.name).toBe("starter-neon");
  });

  it("updates an existing preset on save with same name", async () => {
    const preset1 = {
      name: "mobile-only",
      createdAt: "2026-09-19T10:00:00.000Z",
      config: {
        structure: "standalone" as const,
        auth: "none" as const,
        style: "stylesheet" as const,
      },
    };

    await savePreset(preset1, tempDir);

    const preset2 = {
      name: "mobile-only",
      description: "Updated with Uniwind",
      createdAt: "2026-09-19T11:00:00.000Z",
      config: {
        structure: "standalone" as const,
        auth: "clerk" as const,
        style: "uniwind" as const,
      },
    };

    await savePreset(preset2, tempDir);

    const loaded = await listPresets(tempDir);
    expect(loaded).toHaveLength(1);
    expect(loaded[0]?.description).toBe("Updated with Uniwind");
    expect(loaded[0]?.config.auth).toBe("clerk");
  });

  it("deletes an existing preset and returns false for nonexistent", async () => {
    const preset = {
      name: "to-delete",
      createdAt: "2026-09-19T10:00:00.000Z",
      config: {},
    };

    await savePreset(preset, tempDir);
    expect(await loadPresets(tempDir)).toHaveLength(1);

    const deleted = await deletePreset("to-delete", tempDir);
    expect(deleted).toBe(true);
    expect(await loadPresets(tempDir)).toHaveLength(0);

    const deleteAgain = await deletePreset("to-delete", tempDir);
    expect(deleteAgain).toBe(false);
  });

  it("gracefully recovers from corrupted file by returning empty array", async () => {
    const filePath = getPresetsFilePath(tempDir);
    await fs.mkdir(tempDir, { recursive: true });
    await fs.writeFile(filePath, "invalid-json{{", "utf8");

    const presets = await loadPresets(tempDir);
    expect(presets).toEqual([]);
  });

  it("supports synchronous loadPresetsSync, savePresetSync, and getPresetSync", () => {
    const preset = {
      name: "sync-preset",
      description: "Synchronous preset test",
      createdAt: "2026-09-19T11:00:00.000Z",
      config: {
        structure: "standalone" as const,
        auth: "clerk" as const,
        style: "uniwind" as const,
      },
    };

    savePresetSync(preset, tempDir);
    const loaded = loadPresetsSync(tempDir);
    expect(loaded).toHaveLength(1);
    expect(loaded[0]?.name).toBe("sync-preset");

    const found = getPresetSync("sync-preset", tempDir);
    expect(found?.name).toBe("sync-preset");
    expect(found?.description).toBe("Synchronous preset test");

    const missing = getPresetSync("non-existent", tempDir);
    expect(missing).toBeUndefined();
  });
});
