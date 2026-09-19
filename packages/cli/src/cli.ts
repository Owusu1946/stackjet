import { processIo } from "./io.js";
import { runProgram } from "./program.js";

const knownCommands = new Set(["create", "preset", "doctor", "env", "info", "help"]);
const argv = [...process.argv];
const firstArgument = argv[2];
if (!firstArgument || (!firstArgument.startsWith("-") && !knownCommands.has(firstArgument))) {
  argv.splice(2, 0, "create");
}

await runProgram(argv, processIo);
