import { type PropsWithChildren } from "react";
import { authClient } from "../auth/client";
import type { SessionState } from "./types";
export function SessionProvider({ children }: PropsWithChildren) { return children; }
export function useSession(): SessionState {
  const session = authClient.useSession();
  return { status: session.isPending ? "loading" : session.data ? "authenticated" : "unauthenticated", user: session.data?.user ? { id: session.data.user.id, displayName: session.data.user.name } : null, signIn: () => {}, signOut: () => { void authClient.signOut(); } };
}
