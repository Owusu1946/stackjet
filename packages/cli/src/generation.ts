import { ExitCode, executePlan, type GenerationPlan, type Operation } from "@stackjet/core";
import type { CreateInput } from "@stackjet/schemas";
import { sdk57Files, sdk57FilesSha256 } from "@stackjet/sdk-57";
import { CliError } from "./errors.js";

export function buildCreatePlan(input: CreateInput): GenerationPlan {
  if (input.structure !== "standalone" || input.auth !== "none" || input.style !== "stylesheet") {
    throw new CliError(
      "Phase 2 generation supports standalone + no auth + StyleSheet only",
      ExitCode.InvalidInput,
      "Use --structure standalone --auth none --style stylesheet, or wait for Phase 3 adapters.",
    );
  }
  const owner = `sdk-57:${sdk57FilesSha256.slice(0, 12)}`;
  const operations: Operation[] = Object.entries(sdk57Files).map(([path, content]) => ({
    type: "write-file",
    path,
    content,
    owner,
  }));
  operations.push(
    {
      type: "patch-json",
      path: "package.json",
      edits: [{ path: ["name"], value: input.projectName }],
      owner,
    },
    {
      type: "patch-json",
      path: "app.json",
      edits: [
        { path: ["expo", "name"], value: input.projectName },
        { path: ["expo", "slug"], value: input.projectName },
        { path: ["expo", "scheme"], value: input.projectName },
      ],
      owner,
    },
    {
      type: "write-file",
      path: "stackjet.jsonc",
      content: `${JSON.stringify(
        {
          $schema: "https://stackjet.dev/schemas/project.schema.json",
          generatorVersion: "0.0.0",
          sdk: 57,
          sdkPackSha256: sdk57FilesSha256,
          structure: input.structure,
          packageManager: input.packageManager,
          adapters: { auth: input.auth, style: input.style },
        },
        null,
        2,
      )}\n`,
      owner: "stackjet",
    },
  );
  return { destination: input.destination, operations };
}

export function generateCreatePlan(input: CreateInput, dryRun: boolean) {
  return executePlan(buildCreatePlan(input), { dryRun });
}
