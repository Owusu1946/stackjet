import {
  authAdapter,
  databaseAdapter,
  monorepoPlatformAdapter,
  ormAdapter,
  styleAdapter,
  themeAdapter,
} from "@expojet/adapters";
import { commandName, manifestFileName } from "@expojet/brand";
import { executePlan, type GenerationPlan, type Operation } from "@expojet/core";
import type { CreateInput } from "@expojet/schemas";
import { sdk57Files, sdk57FilesSha256 } from "@expojet/sdk-57";

export function buildCreatePlan(input: CreateInput): GenerationPlan {
  const database = input.database ?? (input.structure === "standalone" ? "none" : "neon");
  const orm = input.orm ?? (database === "none" ? "none" : "drizzle");
  const normalizedInput: CreateInput = { ...input, database, orm };

  const owner = `sdk-57:${sdk57FilesSha256.slice(0, 12)}`;
  const mobileRoot = normalizedInput.structure === "standalone" ? "" : "apps/mobile/";
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
            normalizedInput.structure === "standalone"
              ? normalizedInput.projectName
              : `@${normalizedInput.projectName}/mobile`,
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
        { path: ["expo", "name"], value: normalizedInput.projectName },
        { path: ["expo", "slug"], value: normalizedInput.projectName },
        { path: ["expo", "scheme"], value: normalizedInput.projectName },
      ],
      owner,
    },
    {
      type: "write-file",
      path: manifestFileName,
      content: `${JSON.stringify(
        {
          $schema: "https://expojet.dev/schemas/project.schema.json",
          generatorVersion: "0.1.0",
          sdk: 57,
          sdkPackSha256: sdk57FilesSha256,
          structure: normalizedInput.structure,
          packageManager: normalizedInput.packageManager,
          adapters: {
            auth: normalizedInput.auth,
            style: normalizedInput.style,
            database: normalizedInput.database,
            orm: normalizedInput.orm,
          },
          features: {
            onboarding: normalizedInput.onboarding,
            darkMode: normalizedInput.darkMode,
          },
        },
        null,
        2,
      )}\n`,
      owner: commandName,
    },
    {
      type: "write-file",
      path: `${mobileRoot}src/${commandName}-features.ts`,
      content: `export const features = ${JSON.stringify({ onboarding: normalizedInput.onboarding, darkMode: normalizedInput.darkMode }, null, 2)} as const;\n`,
      owner: commandName,
    },
    {
      type: "write-file",
      path: `${mobileRoot}src/stackjet-features.ts`,
      content: `export { features } from "./${commandName}-features.js";\n`,
      owner: commandName,
    },
  );
  operations.push(...authAdapter(normalizedInput.auth).plan(normalizedInput, {}));
  operations.push(...styleAdapter(normalizedInput.style).plan(normalizedInput, {}));
  operations.push(...themeAdapter.plan(normalizedInput, {}));
  operations.push(...monorepoPlatformAdapter.plan(normalizedInput, {}));
  operations.push(...databaseAdapter(normalizedInput.database).plan(normalizedInput, {}));
  operations.push(...ormAdapter(normalizedInput.orm).plan(normalizedInput, {}));
  if (normalizedInput.eas) {
    operations.push({
      type: "write-file",
      path: `${mobileRoot}eas.json`,
      content: `${JSON.stringify({ cli: { version: ">= 16.0.0" }, build: { development: { developmentClient: true, distribution: "internal" }, preview: { distribution: "internal" }, production: { autoIncrement: true } }, submit: { production: {} } }, null, 2)}\n`,
      owner: `${commandName}:eas`,
    });
  }
  return { destination: normalizedInput.destination, operations };
}

export function generateCreatePlan(input: CreateInput, dryRun: boolean) {
  return executePlan(buildCreatePlan(input), { dryRun });
}
