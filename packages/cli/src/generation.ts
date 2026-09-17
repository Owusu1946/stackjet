import {
  authAdapter,
  monorepoPlatformAdapter,
  styleAdapter,
  themeAdapter,
} from "@stackjet/adapters";
import { executePlan, type GenerationPlan, type Operation } from "@stackjet/core";
import type { CreateInput } from "@stackjet/schemas";
import { sdk57Files, sdk57FilesSha256 } from "@stackjet/sdk-57";

export function buildCreatePlan(input: CreateInput): GenerationPlan {
  const owner = `sdk-57:${sdk57FilesSha256.slice(0, 12)}`;
  const mobileRoot = input.structure === "standalone" ? "" : "apps/mobile/";
  const operations: Operation[] = Object.entries(sdk57Files)
    .filter(
      ([path]) =>
        path !== "pnpm-lock.yaml" ||
        (input.structure === "standalone" &&
          input.packageManager === "pnpm" &&
          input.style === "stylesheet"),
    )
    .map(([path, content]) => ({
      type: "write-file",
      path: `${mobileRoot}${path}`,
      content,
      owner,
    }));
  operations.push(
    {
      type: "patch-json",
      path: `${mobileRoot}package.json`,
      edits: [
        {
          path: ["name"],
          value:
            input.structure === "standalone" ? input.projectName : `@${input.projectName}/mobile`,
        },
        {
          path: ["scripts", "dev"],
          value: "expo start",
        },
      ],
      owner,
    },
    {
      type: "patch-json",
      path: `${mobileRoot}app.json`,
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
          features: { onboarding: input.onboarding, darkMode: input.darkMode },
        },
        null,
        2,
      )}\n`,
      owner: "stackjet",
    },
    {
      type: "write-file",
      path: `${mobileRoot}src/stackjet-features.ts`,
      content: `export const features = ${JSON.stringify({ onboarding: input.onboarding, darkMode: input.darkMode }, null, 2)} as const;\n`,
      owner: "stackjet",
    },
  );
  operations.push(...authAdapter(input.auth).plan(input, {}));
  operations.push(...styleAdapter(input.style).plan(input, {}));
  operations.push(...themeAdapter.plan(input, {}));
  operations.push(...monorepoPlatformAdapter.plan(input, {}));
  if (input.eas) {
    operations.push({
      type: "write-file",
      path: `${mobileRoot}eas.json`,
      content: `${JSON.stringify({ cli: { version: ">= 16.0.0" }, build: { development: { developmentClient: true, distribution: "internal" }, preview: { distribution: "internal" }, production: { autoIncrement: true } }, submit: { production: {} } }, null, 2)}\n`,
      owner: "stackjet:eas",
    });
  }
  return { destination: input.destination, operations };
}

export function generateCreatePlan(input: CreateInput, dryRun: boolean) {
  return executePlan(buildCreatePlan(input), { dryRun });
}
