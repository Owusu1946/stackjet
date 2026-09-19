import { arch, platform, release } from "node:os";
import { manifestFileName, productName, tagline } from "@expojet/brand";
import {
  type CheckResult,
  checkEnvironment,
  ExitCode,
  loadProjectContext,
  runDoctorChecks,
} from "@expojet/core";
import { CliError } from "./errors.js";
import type { CliIo } from "./io.js";

function checkMarker(result: CheckResult) {
  if (result.status === "pass") return "✓";
  if (result.status === "warning") return "!";
  return "✗";
}

export function runDoctor(io: CliIo) {
  const project = loadProjectContext(io.cwd);
  const checks = runDoctorChecks(project);
  io.stdout(`${productName} doctor`);
  for (const check of checks) io.stdout(`${checkMarker(check)} ${check.name}: ${check.message}`);
  if (checks.some((check) => check.status === "fail")) return ExitCode.Environment;
  return ExitCode.Success;
}

export function runEnvCheck(io: CliIo) {
  const project = loadProjectContext(io.cwd);
  if (!project) {
    throw new CliError(
      `No ${manifestFileName} found in the current directory`,
      ExitCode.ProjectState,
      `Run this command from a generated ${productName} project.`,
    );
  }
  const results = checkEnvironment(project);
  if (results.length === 0) io.stdout("! No environment examples were found.");
  for (const result of results) {
    const marker = result.status === "present" ? "✓" : "✗";
    io.stdout(
      `${marker} ${result.workspace}: ${result.variable} [${result.classification}] ${result.status}`,
    );
  }
  return results.some((result) => result.status === "missing")
    ? ExitCode.Environment
    : ExitCode.Success;
}

export function runInfo(io: CliIo, version: string) {
  const project = loadProjectContext(io.cwd);
  const checks = runDoctorChecks(project);
  io.stdout(`${productName} ${version}`);
  io.stdout(tagline);
  io.stdout(`OS: ${platform()} ${release()} (${arch()})`);
  io.stdout(`Node: ${process.version}`);
  io.stdout(`Package manager: ${process.env.npm_config_user_agent ?? "not detected"}`);
  io.stdout(`Project: ${project ? "." : "not detected"}`);
  if (project) {
    io.stdout(`SDK: ${project.manifest.sdk}`);
    io.stdout(`Structure: ${project.manifest.structure}`);
    io.stdout(`Package manager: ${project.manifest.packageManager}`);
    io.stdout(`Auth: ${project.manifest.adapters.auth}`);
    io.stdout(`Style: ${project.manifest.adapters.style}`);
  }
  io.stdout(`Checks: ${checks.map((check) => `${check.name}=${check.status}`).join(", ")}`);
  return ExitCode.Success;
}

export async function runPresetList(io: CliIo, customDir?: string): Promise<number> {
  const { loadPresets } = await import("@expojet/core");
  const presets = await loadPresets(customDir);
  if (presets.length === 0) {
    io.stdout("No saved presets found.");
    io.stdout(
      `Save a preset interactively during '${productName.toLowerCase()} create' or with '--save-preset <name>'.`,
    );
    return ExitCode.Success;
  }
  io.stdout("Saved Presets:");
  for (const preset of presets) {
    const summary = [
      preset.config.structure ?? "standalone",
      preset.config.navigation ?? "router",
      preset.config.auth ?? "clerk",
      preset.config.style ?? "uniwind",
      preset.config.packageManager ?? "pnpm",
    ].join(", ");
    io.stdout(`  • ${preset.name} (${summary})`);
    if (preset.description) {
      io.stdout(`    ${preset.description}`);
    }
  }
  return ExitCode.Success;
}

export async function runPresetShow(name: string, io: CliIo, customDir?: string): Promise<number> {
  const { getPreset } = await import("@expojet/core");
  const preset = await getPreset(name, customDir);
  if (!preset) {
    io.stderr(`Preset "${name}" not found.`);
    return ExitCode.InvalidInput;
  }
  io.stdout(`Preset: ${preset.name}`);
  if (preset.description) io.stdout(`Description: ${preset.description}`);
  io.stdout(`Created at: ${preset.createdAt}`);
  io.stdout("Configuration:");
  io.stdout(JSON.stringify(preset.config, null, 2));
  return ExitCode.Success;
}

export async function runPresetRemove(
  name: string,
  io: CliIo,
  customDir?: string,
): Promise<number> {
  const { deletePreset } = await import("@expojet/core");
  const deleted = await deletePreset(name, customDir);
  if (!deleted) {
    io.stderr(`Preset "${name}" not found.`);
    return ExitCode.InvalidInput;
  }
  io.stdout(`Preset "${name}" removed successfully.`);
  return ExitCode.Success;
}
