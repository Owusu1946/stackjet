import * as SecureStore from "expo-secure-store";
import { createContext, type PropsWithChildren, useContext, useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "stackjet.onboarding.v1";
type State = { isLoaded: boolean; isComplete: boolean; complete(): Promise<void>; reset(): Promise<void> };
const Context = createContext<State | null>(null);

export function OnboardingProvider({ children }: PropsWithChildren) {
  const [isLoaded, setLoaded] = useState(false);
  const [isComplete, setComplete] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function restoreOnboarding() {
      try {
        const value = await SecureStore.getItemAsync(STORAGE_KEY);
        if (isMounted) setComplete(value === "complete");
      } catch (error) {
        console.warn("Could not restore onboarding state", error);
      } finally {
        if (isMounted) setLoaded(true);
      }
    }

    void restoreOnboarding();
    return () => {
      isMounted = false;
    };
  }, []);

  const value = useMemo<State>(
    () => ({
      isLoaded,
      isComplete,
      async complete() {
        try {
          await SecureStore.setItemAsync(STORAGE_KEY, "complete");
          setComplete(true);
        } catch (error) {
          console.warn("Could not save onboarding state", error);
        }
      },
      async reset() {
        try {
          await SecureStore.deleteItemAsync(STORAGE_KEY);
          setComplete(false);
        } catch (error) {
          console.warn("Could not reset onboarding state", error);
        }
      },
    }),
    [isComplete, isLoaded],
  );

  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export function useOnboarding() {
  const value = useContext(Context);
  if (!value) throw new Error("useOnboarding must be used inside OnboardingProvider");
  return value;
}
