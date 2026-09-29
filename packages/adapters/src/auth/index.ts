import type { authAdapters } from "@expojet/schemas";
import type { Adapter } from "../contract.js";
import { betterAuthAdapter } from "./better-auth.js";
import { clerkAuthAdapter } from "./clerk.js";
import { firebaseAuthAdapter } from "./firebase.js";
import { jwtAuthAdapter } from "./jwt.js";
import { noneAuthAdapter } from "./none.js";
import { supabaseAuthAdapter } from "./supabase.js";

export { betterAuthAdapter } from "./better-auth.js";
export { clerkAuthAdapter, socialIconSource } from "./clerk.js";
export { firebaseAuthAdapter } from "./firebase.js";
export { jwtAuthAdapter } from "./jwt.js";
export { noneAuthAdapter } from "./none.js";
export { supabaseAuthAdapter } from "./supabase.js";

const byId: Record<(typeof authAdapters)[number], Adapter> = {
  clerk: clerkAuthAdapter,
  "better-auth": betterAuthAdapter,
  supabase: supabaseAuthAdapter,
  firebase: firebaseAuthAdapter,
  jwt: jwtAuthAdapter,
  none: noneAuthAdapter,
};

export function authAdapter(id: (typeof authAdapters)[number]): Adapter {
  return byId[id];
}
