import { hc } from "hono/client";
import type { AppType } from "@stackjet/api-contract";
import { authClient } from "./auth-client";
import { env } from "./env";

const timeoutMs = 10_000;

export const api = hc<AppType>(env.EXPO_PUBLIC_API_URL, {
  fetch: async (input: RequestInfo | URL, init?: RequestInit) => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const cookie = await authClient.getCookie();
      const headers = new Headers(init?.headers);
      if (cookie) headers.set("Cookie", cookie);
      return await fetch(input, { ...init, headers, credentials: "omit", signal: controller.signal });
    } finally {
      clearTimeout(timer);
    }
  },
});
