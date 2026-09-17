import { createContext, type PropsWithChildren, useContext, useMemo, useState } from "react";
import type { SessionState, SessionStatus } from "./types";

const SessionContext = createContext<SessionState | null>(null);

export function SessionProvider({ children }: PropsWithChildren) {
  const [status, setStatus] = useState<SessionStatus>("authenticated");
  const value = useMemo<SessionState>(
    () => ({
      status,
      user: status === "authenticated" ? { id: "local-user", displayName: "Local user" } : null,
      signIn: () => setStatus("authenticated"),
      signOut: () => setStatus("unauthenticated"),
    }),
    [status],
  );
  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession() {
  const value = useContext(SessionContext);
  if (!value) throw new Error("useSession must be used inside SessionProvider");
  return value;
}
