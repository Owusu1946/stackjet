import { commandName, productName, tagline } from "@expojet/brand";
import { ExitCode, redactText } from "@expojet/core";
import {
  authAdapters,
  backendAdapters,
  databaseAdapters,
  iconLibraries,
  navigationAdapters,
  navigationTypes,
  ormAdapters,
  packageManagers,
  stateAdapters,
  structures,
  styleAdapters,
} from "@expojet/schemas";
import { Command, Option } from "commander";
import {
  runDoctor,
  runEnvCheck,
  runInfo,
  runPresetList,
  runPresetRemove,
  runPresetShow,
} from "./commands.js";
import { type CreateFlags, runCreate } from "./create.js";
import { CliError } from "./errors.js";
import type { CliIo } from "./io.js";

export const cliVersion = "0.3.0";

function decorateCommand(command: Command) {
  return command.showHelpAfterError("Run with --help for usage.");
}

export function createProgram(io: CliIo) {
  const program = decorateCommand(new Command());
  program
    .name(commandName)
    .description(tagline)
    .version(cliVersion)
    .configureOutput({
      writeOut: (message) => io.stdout(message.trimEnd()),
      writeErr: (message) => io.stderr(redactText(message.trimEnd())),
    })
    .exitOverride()
    .addHelpText(
      "after",
      `\nExit codes:\n  0 success\n  1 unexpected failure\n  2 invalid input\n  3 environment/check failure\n  4 invalid project state\n  5 cancelled`,
    );

  decorateCommand(program.command("create [project-name]"))
    .description(`Validate and normalize a new ${productName} project request`)
    .option("--config <path>", "load defaults from a JSON configuration file")
    .option("--destination <path>", "target directory")
    .addOption(new Option("--structure <type>").choices([...structures]))
    .addOption(new Option("--package-manager <name>").choices([...packageManagers]))
    .addOption(new Option("--navigation <adapter>").choices([...navigationAdapters]))
    .addOption(new Option("--navigation-type <type>").choices([...navigationTypes]))
    .addOption(new Option("--backend <adapter>").choices([...backendAdapters]))
    .addOption(new Option("--auth <adapter>").choices([...authAdapters]))
    .addOption(new Option("--style <adapter>").choices([...styleAdapters]))
    .addOption(
      new Option("--icons <library>", "icon library to include").choices([...iconLibraries]),
    )
    .option("--lucide", "use Lucide icons (default)")
    .option("--hugeicons", "use Hugeicons")
    .option("--expo-icons", "use Expo vector icons")
    .addOption(
      new Option("--state <adapter>", "state management adapter").choices([...stateAdapters]),
    )
    .option("--zustand", "use Zustand state management")
    .option("--mobx", "use MobX state management")
    .option(
      "--liquid-glass",
      "enable Liquid Glass UI engine with native iOS 26 and cross-platform blur fallback",
    )
    .option("--no-liquid-glass", "disable Liquid Glass UI engine")
    .addOption(new Option("--database <adapter>").choices([...databaseAdapters]))
    .addOption(new Option("--orm <adapter>").choices([...ormAdapters]))
    .option("--onboarding", "include onboarding")
    .option("--no-onboarding", "exclude onboarding")
    .option("--dark-mode", "include dark mode theme engine")
    .option("--no-dark-mode", "exclude dark mode theme engine")
    .option("--eas", "include EAS profiles")
    .option("--no-eas", "exclude EAS profiles")
    .option("--install", "install dependencies after scaffolding (default: true)")
    .option("--no-install", "skip installing dependencies")
    .option("--git", "initialize a git repository (default: true)")
    .option("--no-git", "skip git repository initialization")
    .option("--allow-current-directory", "explicitly allow an empty current directory")
    .option("--dry-run", "validate and preview the file plan without writing the destination")
    .option("--yes", "accept defaults and disable prompts")
    .option("--experimental", "show and allow experimental adapters")
    .option("--preset <name>", "load defaults from a saved preset")
    .option("--save-preset <name>", "save resulting configuration as a preset")
    .option("--typescript", "use TypeScript (default: true)")
    .option("--no-typescript", "disable TypeScript")
    .action(async (projectName: string | undefined, flags: CreateFlags) => {
      process.exitCode = await runCreate(projectName, flags, io);
    });

  const preset = program
    .command("preset")
    .description("Manage saved project configuration presets");

  decorateCommand(preset.command("list"))
    .description("List all saved configuration presets")
    .action(async () => {
      process.exitCode = await runPresetList(io);
    });

  decorateCommand(preset.command("show <name>"))
    .description("Display details of a saved configuration preset")
    .action(async (name: string) => {
      process.exitCode = await runPresetShow(name, io);
    });

  decorateCommand(preset.command("remove <name>"))
    .alias("delete")
    .description("Delete a saved configuration preset")
    .action(async (name: string) => {
      process.exitCode = await runPresetRemove(name, io);
    });

  decorateCommand(program.command("doctor"))
    .description("Run read-only compatibility and project checks")
    .action(() => {
      process.exitCode = runDoctor(io);
    });

  const env = program
    .command("env")
    .description("Inspect environment configuration without values");
  decorateCommand(env.command("check"))
    .description("Report missing environment variable names and classifications")
    .action(() => {
      process.exitCode = runEnvCheck(io);
    });

  decorateCommand(program.command("info"))
    .description("Print a copyable, secret-free support report")
    .action(() => {
      process.exitCode = runInfo(io, cliVersion);
    });

  return program;
}

export async function runProgram(argv: string[], io: CliIo) {
  const program = createProgram(io);
  try {
    await program.parseAsync(argv);
    return Number(process.exitCode ?? ExitCode.Success);
  } catch (error) {
    if (error instanceof CliError) {
      if (error.message !== "Cancelled") io.stderr(`Error: ${redactText(error.message)}`);
      if (error.recovery) io.stderr(`Recovery: ${error.recovery}`);
      process.exitCode = error.exitCode;
      return error.exitCode;
    }
    if (error instanceof Error && "code" in error && String(error.code).startsWith("commander.")) {
      const code =
        error.code === "commander.helpDisplayed" || error.code === "commander.version"
          ? ExitCode.Success
          : ExitCode.InvalidInput;
      process.exitCode = code;
      return code;
    }
    io.stderr(
      `Unexpected error: ${redactText(error instanceof Error ? error.message : String(error))}`,
    );
    io.stderr(
      `Recovery: Run ${commandName} doctor, then retry with --help if the problem persists.`,
    );
    process.exitCode = ExitCode.Unexpected;
    return ExitCode.Unexpected;
  }
}
