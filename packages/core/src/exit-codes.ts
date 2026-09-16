export const ExitCode = {
  Success: 0,
  Unexpected: 1,
  InvalidInput: 2,
  Environment: 3,
  ProjectState: 4,
  Cancelled: 5,
} as const;

export type ExitCodeValue = (typeof ExitCode)[keyof typeof ExitCode];
