# Stackjet

Stackjet is an Expo-first, compatibility-tested application generator. Phase 0 proved the supported Expo Go combinations, and Phase 1 now provides the typed CLI foundation.

## Phase 1 CLI

The workspace contains separate `cli`, `core`, `adapters`, `schemas`, SDK-pack, and `brand` packages with strict TypeScript boundaries. The CLI can atomically generate standalone, no-auth Expo apps with either StyleSheet or Uniwind.

```powershell
pnpm install
pnpm build
node packages/cli/dist/cli.js --help
node packages/cli/dist/cli.js my-app --yes --auth none --style stylesheet
node packages/cli/dist/cli.js my-uniwind-app --yes --auth none --style uniwind
node packages/cli/dist/cli.js doctor
node packages/cli/dist/cli.js env check
node packages/cli/dist/cli.js info
```

The `create-stackjet my-app` shorthand and `stackjet create my-app` form resolve to the same create command after publication. Add `--dry-run` to preview the exact file plan without creating the destination. Interactive mode uses guided prompts; `--yes` requires enough arguments or configuration to run without prompts. Run `pnpm check` for formatting, checksum verification, type checking, and tests.

## Phase 0 references

- `references/clerk-uniwind`: standalone Expo SDK 57 application using hosted Clerk authentication, secure token restoration, Expo Router protected routes, local onboarding state, and free Uniwind.
- `references/better-auth-monorepo`: Expo SDK 57 plus Hono Node API, Better Auth, Neon PostgreSQL, Drizzle, Hono RPC, TanStack Query, secure cookie storage, and free Uniwind.

Provider credentials are intentionally absent. Copy each `.env.example` file to `.env` and supply test-only values before device certification.

See `docs/phase-0/verification.md` for the evidence ledger and remaining device gates.

## Run the Expo Go references

The Clerk reference deliberately uses hosted authentication, so it works in Expo Go. The Better Auth mobile client also uses Expo Go-compatible JavaScript and Expo SDK modules; its API must be running on a URL your phone or emulator can reach.

### Clerk reference

1. Copy `references/clerk-uniwind/.env.example` to `.env` in the same folder.
2. Replace `pk_test_replace_me` with a Clerk test publishable key.
3. In that folder, run `pnpm start`.
4. Scan the QR code with Expo Go.

### Better Auth reference

1. Create a Neon test database.
2. Copy `references/better-auth-monorepo/apps/api/.env.example` to `.env` and fill in the database URL and a secret of at least 32 characters.
3. Copy `references/better-auth-monorepo/apps/mobile/.env.example` to `.env`.
4. Use `http://10.0.2.2:3000` for an Android emulator. For a physical phone, replace `10.0.2.2` with this computer's local network IP address.
5. From `references/better-auth-monorepo`, run `pnpm --filter @stackjet/better-auth-api db:migrate`.
6. Run `pnpm --filter @stackjet/better-auth-api dev` in one terminal.
7. Run `pnpm --filter @stackjet/better-auth-mobile start` in another terminal and scan the QR code with Expo Go.

Do not run `expo prebuild` or open Android Studio just to use Expo Go. The generated `android` folders are ignored build artifacts used only for native compatibility checks.
