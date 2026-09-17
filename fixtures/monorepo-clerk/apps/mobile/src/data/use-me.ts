import { useAuth } from "@clerk/expo";
import { useQuery } from "@tanstack/react-query";
import { createApiClient } from "./api";
export function useMe() { const { getToken, isSignedIn } = useAuth(); return useQuery({ queryKey: ["me"], enabled: Boolean(isSignedIn), queryFn: async () => { const response = await createApiClient(getToken).v1.me.$get(); if (!response.ok) throw new Error("Unable to load profile"); return response.json(); } }); }
