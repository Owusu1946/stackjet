import { ExitCode, type ExitCodeValue } from "@expojet/core";

export class CliError extends Error {
  override name = "CliError";
  constructor(
    message: string,
    readonly exitCode: ExitCodeValue = ExitCode.Unexpected,
    readonly recovery?: string,
  ) {
    super(message);
  }
}
