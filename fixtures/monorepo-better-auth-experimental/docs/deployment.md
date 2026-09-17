# Deployment

Deploy apps/api to a Node 22 host. Set CLERK_SECRET_KEY, pooled DATABASE_URL, direct DIRECT_DATABASE_URL, and ALLOWED_ORIGINS there. Run pnpm db:migrate as a release job, not from the mobile app. Point EXPO_PUBLIC_API_URL at the HTTPS API before EAS builds. Configure the generated app scheme as an allowed Clerk redirect.

Physical-device gate: start the API on a LAN-reachable address, set the mobile API URL to that address, open the project in Expo Go, complete sign-up/sign-in in the hosted browser, confirm return to the app and a successful authenticated GET /v1/me, then sign out and confirm protected-route redirection.
