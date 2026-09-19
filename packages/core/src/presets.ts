import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { type Preset, presetSchema } from "@expojet/schemas";

export function getPresetsDirectory(customDir?: string): string {
  if (customDir) return customDir;
  if (process.env.EXPOJET_CONFIG_DIR) return process.env.EXPOJET_CONFIG_DIR;
  return path.join(os.homedir(), ".expojet");
}

export function getPresetsFilePath(customDir?: string): string {
  return path.join(getPresetsDirectory(customDir), "presets.json");
}

function getErrorCode(error: unknown): string | undefined {
  if (typeof error === "object" && error !== null && "code" in error) {
    return String((error as { code: unknown }).code);
  }
  return undefined;
}

async function ensureDir(dirPath: string): Promise<void> {
  try {
    await fs.mkdir(dirPath, { recursive: true });
  } catch (error: unknown) {
    if (getErrorCode(error) !== "EEXIST") {
      throw error;
    }
  }
}

export async function loadPresets(customDir?: string): Promise<Preset[]> {
  const filePath = getPresetsFilePath(customDir);
  try {
    const raw = await fs.readFile(filePath, "utf8");
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    const validPresets: Preset[] = [];
    for (const item of parsed) {
      const validated = presetSchema.safeParse(item);
      if (validated.success) {
        validPresets.push(validated.data);
      }
    }
    return validPresets;
  } catch (error: unknown) {
    if (getErrorCode(error) === "ENOENT") {
      return [];
    }
    return [];
  }
}

export async function savePreset(preset: Preset, customDir?: string): Promise<void> {
  const validated = presetSchema.parse(preset);
  const dir = getPresetsDirectory(customDir);
  await ensureDir(dir);

  const presets = await loadPresets(customDir);
  const existingIndex = presets.findIndex(
    (p) => p.name.toLowerCase() === validated.name.toLowerCase(),
  );

  if (existingIndex >= 0) {
    presets[existingIndex] = validated;
  } else {
    presets.push(validated);
  }

  const filePath = getPresetsFilePath(customDir);
  await fs.writeFile(filePath, `${JSON.stringify(presets, null, 2)}\n`, "utf8");
}

export async function getPreset(name: string, customDir?: string): Promise<Preset | undefined> {
  const presets = await loadPresets(customDir);
  return presets.find((p) => p.name.toLowerCase() === name.toLowerCase());
}

export async function deletePreset(name: string, customDir?: string): Promise<boolean> {
  const presets = await loadPresets(customDir);
  const filtered = presets.filter((p) => p.name.toLowerCase() !== name.toLowerCase());

  if (filtered.length === presets.length) {
    return false;
  }

  const dir = getPresetsDirectory(customDir);
  await ensureDir(dir);
  const filePath = getPresetsFilePath(customDir);
  await fs.writeFile(filePath, `${JSON.stringify(filtered, null, 2)}\n`, "utf8");
  return true;
}

export async function listPresets(customDir?: string): Promise<Preset[]> {
  return loadPresets(customDir);
}
