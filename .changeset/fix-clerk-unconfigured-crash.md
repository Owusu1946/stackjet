---
"@expojet/adapters": patch
"create-expojet": patch
---

fix(adapters): prevent Clerk auth crash when publishable key is missing or unconfigured

Render a clear setup notice screen when `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY` is not configured instead of rendering child routes that call `useSignIn()` outside `<ClerkProvider />`. Also fix optional chaining on `errors.global` in the sign-up screen template.
