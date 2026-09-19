import type { AppType } from "@expojet/api-contract";
import { hc } from "hono/client";
import { env } from "../env";
export function createApiClient(getToken: () => Promise<string | null>) {
  return hc<AppType>(env.EXPO_PUBLIC_API_URL, { fetch: async (input: string | Request | URL, init?: RequestInit) => {
    const token = await getToken(); const headers = new Headers(init?.headers); if (token) headers.set("authorization", "Bearer " + token);
    return fetch(input instanceof URL ? input.toString() : input, { ...init, headers });
  } });
}
