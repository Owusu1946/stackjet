import * as p from "@clack/prompts";
import type { CreateInput } from "@expojet/schemas";
import type { CliIo } from "../io.js";

/**
 * Everything the user needs after generation. Written to `io` rather than printed
 * directly so the CLI stays testable without capturing stdout.
 */
export function printResult(
  input: CreateInput,
  result: { files: string[]; committed: boolean },
  io: CliIo,
  status?: { git?: boolean | undefined; install?: boolean | undefined },
) {
  io.stdout(result.committed ? "✓ Project generated atomically" : "✓ Dry run validated");
  io.stdout(`  Project: ${input.projectName}`);
  io.stdout(`  Destination: ${input.destination}`);
  io.stdout(`  Structure: ${input.structure}`);
  io.stdout(`  Package manager: ${input.packageManager}`);
  io.stdout(`  Navigation: ${input.navigation} (${input.navigationType})`);
  io.stdout(`  Backend: ${input.backend}`);
  io.stdout(`  Authentication: ${input.auth}`);
  io.stdout(`  Styling: ${input.style}`);
  io.stdout(`  Database: ${input.database}`);
  io.stdout(`  ORM: ${input.orm}`);
  io.stdout(`  Dark mode: ${input.darkMode ? "enabled" : "disabled"}`);
  if (input.eas) io.stdout("  EAS Build: configured (development, preview, production profiles)");
  io.stdout(`  Files: ${result.files.length}`);
  io.stdout(
    `  Foundation: Expo SDK ${input.sdk}, ${
      input.navigation === "router" ? "Expo Router" : "React Navigation"
    }, strict TypeScript, tests`,
  );
  if (status?.git) io.stdout("  Git: initialized");
  if (status?.install !== undefined) {
    io.stdout(`  Dependencies: ${status.install ? "installed" : "install failed"}`);
  }
  io.stdout("");
  if (result.committed) {
    p.note(nextSteps(input, io, status).join("\n"), "Next steps");
    p.outro(`✨ Project ${input.projectName} is ready!`);
  } else {
    for (const file of result.files) io.stdout(`  + ${file}`);
    io.stdout("No destination files were written.");
  }
}

/** The shortest sequence that gets a generated project running, given what it was built with. */
function nextSteps(
  input: CreateInput,
  io: CliIo,
  status?: { install?: boolean | undefined },
): string[] {
  const relativeTarget = input.destination === io.cwd ? "." : input.projectName;
  const steps = [
    `1. cd ${relativeTarget}`,
    `2. Copy .env.example to .env and configure keys if needed`,
  ];
  let step = 3;
  if (input.backend === "convex") {
    steps.push(`${step++}. ${input.packageManager} run convex:dev (start Convex dev server)`);
  }
  if (input.database === "postgres") {
    steps.push(`${step++}. ${input.packageManager} run db:up (start PostgreSQL container)`);
  }
  if (status?.install === false || !input.install) {
    steps.push(`${step++}. ${input.packageManager} install`);
  }
  if (input.database !== "none" && input.orm !== "none") {
    steps.push(`${step++}. ${input.packageManager} run db:migrate`);
  }
  if (input.eas) steps.push(`${step++}. npx eas build --profile preview`);
  steps.push(`${step++}. ${input.packageManager} run dev`);
  return steps;
}
