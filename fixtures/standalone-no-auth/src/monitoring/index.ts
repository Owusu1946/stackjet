export function captureException(_error: unknown): void {}
export function captureMessage(_message: string): void {}
export function setUser(_user: { id: string } | null): void {}
export function addBreadcrumb(_breadcrumb: Record<string, unknown>): void {}
export function withScope(_callback: (scope: unknown) => void): void {}
export function wrap<T>(component: T): T {
  return component;
}
