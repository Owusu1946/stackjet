export interface CliIo {
  cwd: string;
  stdout(message: string): void;
  stderr(message: string): void;
}

export const processIo: CliIo = {
  cwd: process.cwd(),
  stdout: (message) => console.log(message),
  stderr: (message) => console.error(message),
};
