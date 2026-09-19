import * as SecureStore from "expo-secure-store";
import {
  createContext,
  type PropsWithChildren,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

const STORAGE_KEY = "expojet.onboarding.v1";
type OnboardingState = {
  status: "loading" | "ready";
  complete: boolean;
  finish(): Promise<void>;
  reset(): Promise<void>;
};
const OnboardingContext = createContext<OnboardingState | null>(null);

export function OnboardingProvider({ children }: PropsWithChildren) {
  const [status, setStatus] = useState<OnboardingState["status"]>("loading");
  const [complete, setComplete] = useState(false);
  useEffect(() => {
    SecureStore.getItemAsync(STORAGE_KEY)
      .then((value) => setComplete(value === "complete"))
      .catch(() => setComplete(false))
      .finally(() => setStatus("ready"));
  }, []);
  const value = useMemo<OnboardingState>(
    () => ({
      status,
      complete,
      finish: async () => {
        await SecureStore.setItemAsync(STORAGE_KEY, "complete");
        setComplete(true);
      },
      reset: async () => {
        await SecureStore.deleteItemAsync(STORAGE_KEY);
        setComplete(false);
      },
    }),
    [status, complete],
  );
  return <OnboardingContext.Provider value={value}>{children}</OnboardingContext.Provider>;
}

export function useOnboarding() {
  const value = useContext(OnboardingContext);
  if (!value) throw new Error("useOnboarding must be used inside OnboardingProvider");
  return value;
}
