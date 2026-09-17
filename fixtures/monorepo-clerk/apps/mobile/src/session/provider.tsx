import { ClerkProvider, useAuth, useUser } from "@clerk/expo";
import { tokenCache } from "@clerk/expo/token-cache";
import { createContext, type PropsWithChildren, useContext, useMemo } from "react";
import { env } from "../env";
import type { SessionState } from "./types";

const SessionContext = createContext<SessionState | null>(null);
function ClerkSession({ children }: PropsWithChildren) {
  const auth = useAuth();
  const { user } = useUser();
  const value = useMemo<SessionState>(() => ({
    status: !auth.isLoaded ? "loading" : auth.isSignedIn ? "authenticated" : "unauthenticated",
    user: auth.isSignedIn && user ? { id: user.id, displayName: user.fullName ?? user.primaryEmailAddress?.emailAddress ?? undefined } : null,
    signIn: () => {},
    signOut: () => { void auth.signOut(); },
  }), [auth.isLoaded, auth.isSignedIn, auth.signOut, user]);
  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}
export function SessionProvider({ children }: PropsWithChildren) {
  return <ClerkProvider publishableKey={env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY} tokenCache={tokenCache}><ClerkSession>{children}</ClerkSession></ClerkProvider>;
}
export function useSession() {
  const value = useContext(SessionContext);
  if (!value) throw new Error("useSession must be used inside SessionProvider");
  return value;
}
