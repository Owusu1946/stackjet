import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { ExitCode } from "@expojet/core";
import { type CreateConfig, createConfigSchema } from "@expojet/schemas";
import { CliError } from "../errors.js";

export function readConfig(cwd: string, configPath?: string): CreateConfig {
  if (!configPath) return {};
  const absolutePath = resolve(cwd, configPath);
  try {
    return createConfigSchema.parse(JSON.parse(readFileSync(absolutePath, "utf8")));
  } catch (error) {
    throw new CliError(
      `Could not load a valid create config from ${configPath}: ${error instanceof Error ? error.message : "unknown error"}`,
      ExitCode.InvalidInput,
      "Correct the config file and run the command again.",
    );
  }
}
