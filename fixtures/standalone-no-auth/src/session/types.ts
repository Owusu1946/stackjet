export type SessionStatus = "loading" | "authenticated" | "unauthenticated";

export interface SessionState {
  status: SessionStatus;
  user: { id: string; displayName?: string } | null;
  signIn(): void;
  signOut(): void;
}
