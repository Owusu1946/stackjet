# create-expojet

## 0.8.1

### Patch Changes

- 7c084ed: Add optional stack-aware coding-agent skills installation after project creation
  and through `expojet skills install`. Select individual applicable skills, coding
  agents, and project/global scope; preview pinned sources, preserve existing edits,
  and retry partial failures without changing the app manifest.

## 0.8.0

### Minor Changes

- ebf4b26: Add Expo SDK 58 as an optional choice when creating a project. SDK 57 remains the default.

### Patch Changes

- 90f1458: Detect conflicting JSON patch and composition operations

  `detectPlanConflicts` claimed ownership for `write-file`, `copy-tree`, `add-dependency`,
  `add-env` and `add-script`. `patch-json`, `patch-jsonc`, `compose-metro` and
  `compose-app-config` fell through to `default: break` and were never claimed, so two adapters
  could patch the same `package.json` or `app.json` pointer, or contribute a conflicting Metro
  wrapper, without `executePlan` raising `PlanConflictError`.

  Repeated array appends and deletions are rejected, even when their paths and values match,
  because each operation changes the array again.

  `patch-json` and `patch-jsonc` are now claimed per file *and* per JSON pointer, so two owners
  writing different pointers in the same file still compose while two owners writing the same
  pointer with different values are rejected. Metro contributions are claimed per workspace and
  contribution id; app config plugins per workspace and plugin name.

  Overlapping JSON writes are order-dependent because `jsonc-parser` applies each edit against
  the current text, so rejecting them up front is the difference between a clear error and a plan
  that renders differently depending on adapter ordering.
- 3364df5: Reject symbolic links in copied trees before rendering. Later operations cannot follow a copied
  link and overwrite files outside the staging directory.
- 3105338: Use the same operation renderer for generated projects and in-memory previews. Read current file
  contents after copied files and normalize equivalent paths so later edits preserve earlier changes.

  Keep preset loading consistent between the sync and async APIs. Doctor now flags known server
  credential names in mobile source and JSON files even with an EXPO_PUBLIC_ prefix.
- bb3c389: Keep interactive shorthand flags consistent with `--yes` and stop creation when any prompt is
  cancelled. Saved presets retain the selected social providers, analytics, SDK, and haptics.
- bf166e0: Keep `--config` files and saved presets partial instead of filling in every default

  `createConfigSchema` was derived from the defaulted create schema with `.partial()`. Zod wraps a
  field in `ZodOptional` but leaves the inner default in place, so parsing a config file produced a
  fully-populated configuration. Every omitted key then outranked both `--preset` and the CLI
  fallbacks, and the interactive prompts stopped appearing whenever `--config` was used.

  A one-line config file now behaves as documented:

  ```json
  { "structure": "monorepo" }
  ```

  ```console
  # before: Database: none, ORM: none
  # after:  Database: neon, ORM: drizzle
  ```
- 4ae2d39: Reject adapter-owned Metro files that composition would silently replace. Generation omits the
  SDK's default Metro file when a composed config takes ownership, preserving the generated output.
- 100a483: Preserve every create choice when saving a preset

  `--save-preset` wrote a preset that omitted `analytics`, `haptics` and `sdk`, and the interactive
  "save this configuration" prompt omitted `haptics` and `sdk`. Because the preset schema filled in
  defaults for the missing keys, the file on disk claimed values the user never chose, and re-running
  `expojet my-app --preset mypreset` generated a different stack than the one that was saved.

  Both call sites now share one helper that serialises the whole resolved input, so the two paths
  cannot drift again.

## 0.7.0

### Minor Changes

- Add Tactile Haptics Engine (`expo-haptics`) with cross-platform safe vibration utilities and pre-wired interactive feedback in `ThemeToggle`, `CounterCard`, and navigation tabs.
- Add Sentry error monitoring adapter with `@sentry/react-native`, native app config plugin, and Stack Builder integration.

### Patch Changes

- Prevent Clerk auth crash when publishable key is missing or unconfigured.
- Resolve dark theme text contrast on generated home page.
- Fix `--socials` CLI flag resolution in non-interactive and interactive creation.

## 0.6.3

### Patch Changes

- Add Vercel Web Analytics to the Expojet landing site.
- Add the generated Expo asset set and update the public release surfaces to 0.6.3.
- Fix the landing build's Biome import-order check.

## 0.6.2

### Patch Changes

- Add Supabase email OTP authentication with eight-digit boxed-code verification and resend support.
- Document Supabase OTP email-template and SMTP setup requirements in generated project guidance.

## 0.6.1

### Patch Changes

- Validate project names, destinations, preset names, and incompatible options before the interactive flow reaches its end.
- Fix generated Clerk + Convex user synchronization so authenticated users are created or updated with their Clerk email and name.
- Fix generated Expo Router projects so dark mode is mounted globally and onboarding can appear before authentication.
- Fix Convex TypeScript generation to include Node types and correct generated social-icon imports.

## 0.6.0

### Minor Changes

- b2eaad3: Improve generated Expo apps with native liquid-glass navigation, custom Clerk authentication screens, password recovery, multi-step onboarding, theme-aware navigation surfaces, icon-library password controls, and production-oriented SDK 57 scaffolding.

### Patch Changes

- 25743c9: Add configurable Clerk social sign-in for Google, Apple, Facebook, and Microsoft with Expo Go-compatible browser SSO buttons.
- fb9f3b0: Add a dedicated visual stack builder with locally bundled technology icons, smooth guided configuration, compatibility-aware selections, copyable CLI commands, and a byte-accurate generated file preview sourced from the real CLI generation plan.

## 0.5.1

### Patch Changes

- Add multi-select Clerk social sign-in providers for generated Expo apps.
- Generate Expo Go-compatible browser SSO buttons with Google, Apple, Facebook, and Microsoft icons.
- Add the `--socials <providers...>` CLI flag for reproducible commands generated by the visual stack builder.

## 0.5.0

### Minor Changes

- Improve generated auth, onboarding, theme switching, navigation, icon handling, and Expo SDK 57 app scaffolding.

## 0.4.0

### Minor Changes

- - **EAS Production Pipeline**: Automated EAS Build configuration (`eas.json`) with `development` (iOS simulator), `preview` (internal distribution), and `production` profiles.
  - **Mobile Icon Adapters**: Support for Lucide, Iconsax, Hugeicons, Ionicons, and FontAwesome with unified type-safe icon wrappers.
  - **State Management Adapters**: Added Zustand, MobX, and TanStack Query adapters with persistent stores and hydration.
  - **Liquid Glass Design System**: Glassmorphism UI components (`GlassCard`, `GlassTabBarBackground`) with native blur effects.
  - **Theme Engine**: Semantic dark mode and light mode tokens with persistent switching.
  - **CLI Presets Workflow**: Save and manage project configurations via `preset list`, `preset show`, `preset remove`, `--preset`, and `--save-preset`.
  - **Mobile Analytics**: Privacy-first telemetry and product analytics via PostHog and Aptabase adapters with strict secret boundary isolation.
  - **Reliable Package Manager Installation**: Cross-platform child process execution with `--ignore-workspace` pnpm isolation and post-install validation.

## 0.3.0

### Minor Changes

- **Phase 8: Core Schemas, Types & Preset Engine**
  - Add ecosystem Zod schemas (`packageManagers`, `navigationTypes`, `iconLibraries`, `stateAdapters`, `analyticsAdapters`, `presetSchema`).
  - Add local preset CRUD engine in `@expojet/core/src/presets.ts` (`loadPresets`, `savePreset`, `deletePreset`, `getPreset`, and synchronous helpers) persisting into `~/.expojet/presets.json`.
  - Extend manifest features with backwards compatibility.
- **Phase 9: Intelligent Package Manager Detection & Interactive UX**
  - Add environment auto-detection engine in `@expojet/core/src/package-manager.ts` parsing `process.env.npm_config_user_agent` and PATH binaries for pnpm, bun, npm, and yarn.
  - Add interactive CLI prompts: start-of-CLI saved preset loader, explicit TypeScript prompt, package manager confirmation with detected version hint, and end-of-CLI preset save prompt.
  - Add CLI preset subcommands: `expojet preset list`, `expojet preset show <name>`, and `expojet preset remove <name>`.
  - Add CLI flags: `--preset <name>`, `--save-preset <name>`, `--typescript`, `--no-typescript`, `--package-manager <name>`.
- **Phase 10: Advanced Navigation Layout Matrix**
  - Add complete layout matrix across both Expo Router (Expo SDK 57) and React Navigation supporting `tabs`, `drawer`, `both` (drawer + tabs), and `stack`.
  - Add automatic dependency injection for `@react-navigation/drawer` (`^7.0.14`), `react-native-gesture-handler` (`~2.28.0`), and `@react-navigation/bottom-tabs` (`^7.0.14`).
  - Add root layout wrapping in `<GestureHandlerRootView>` when drawer or both is selected.
  - Add CLI flag `--navigation-type <tabs|drawer|both|stack>` and interactive selection prompt.
  - Add doctor diagnostics validating Expo Router protected layout, nested tabs layout, and React Navigation navigators.

## 0.2.1

### Patch Changes

- Fix: Eliminate remaining Stackjet branding references in generated apps and fixtures
  
  - Dynamically resolve uppercase brand name from `@expojet/brand` into `BrandCard` across all style adapters (`NativeWind`, `Uniwind`, `StyleSheet`, and `Unistyles`).
  - Remove generation of legacy `src/stackjet-features.ts` in newly scaffolded apps, standardizing on `src/expojet-features.ts`.
  - Update Expo SDK 57 base template README title and verify immutable pack SHA-256 integrity.
  - Update SDK pack JSON schema ID and title to `expojet.dev` and `Expojet SDK pack`.
  - Update all reference fixtures to use `@expojet/api` and `@expojet/api-contract`.
  - Update security, third-party notices, contributing, and compatibility documentation.

## 0.2.0

### Minor Changes

- 861fac3: Phase 3: Database & ORM Matrix
  
  - Support Neon (Serverless Postgres), PostgreSQL (Local Docker Compose), SQLite (LibSQL / expo-sqlite), and None.
  - Support Drizzle ORM and Prisma ORM.
  - Add `--database` and `--orm` CLI flags and interactive selection prompts.
  - Add PostgreSQL Docker compose and ORM migration doctor diagnostics.
  - Ensure strict mobile secret boundary across all database and ORM combinations.
- b60641a: Phase 4: Managed Cloud Ecosystems (Supabase & Firebase)
  
  - Add Supabase Auth and Firebase Auth adapters with native secure storage persistence.
  - Add Supabase Postgres database adapter with pooled and direct connection handling.
  - Support both standalone Expo SDK 57 mobile apps and full-stack Hono monorepos with Supabase and Firebase.
  - Add server-side token verification for Supabase JWTs and Firebase Admin ID tokens in `apps/api`.
  - Add typed React Query hooks (`useMe`) connecting mobile auth state with the Hono backend.
  - Enforce strict mobile secret isolation preventing `SUPABASE_SERVICE_ROLE_KEY` and server secrets from leaking into mobile bundles.
  - Add Maestro flows for Supabase and Firebase authentication.
- 40b08b5: Phase 5: Alternative API Backends (Express, NestJS & Convex)
  
  - Add Express backend adapter with Helmet, CORS, Supertest tests, and typed fetch client.
  - Add NestJS backend adapter with modular architecture (`AppModule`, `HealthController`, `MeController`, auth guard, services, and tests).
  - Add Convex reactive backend adapter supporting both standalone Expo apps and full-stack monorepos with `ConvexProvider`, reactive hooks, and `convex dev` workflow.
  - Add `--backend` CLI flag and interactive framework selector with validation rules.
  - Add doctor diagnostics for Express, NestJS, and Convex entrypoints and schemas.
  - Maintain 100% backwards compatibility with existing Hono RPC workflows.
- ce5cafc: Phase 6: React Navigation & Custom JWT Authentication
  
  - Add React Navigation adapter (`--navigation <router|react-navigation>`, default `"router"`) supporting component-based navigation.
    - Generates `index.js`, `src/App.tsx`, `src/navigation/RootNavigator.tsx`, `src/navigation/AppNavigator.tsx` (bottom tabs), `src/navigation/AuthNavigator.tsx` (stack), and screens under `src/screens/`.
    - Automatically omits `app/` file-based routing directory when React Navigation is chosen.
    - Installs `@react-navigation/native`, `@react-navigation/native-stack`, and `@react-navigation/bottom-tabs`.
  - Add Custom JWT Authentication adapter (`--auth jwt`) with self-hosted token lifecycle.
    - Implements SecureStore token storage (`expo-secure-store`) with auto-refresh fetch interceptor (`src/auth/jwt-client.ts`).
    - Provides `SessionProvider` (`src/session/provider.tsx`) with `signIn`, `signUp`, and `signOut` methods.
    - Generates sign-in and sign-up UI screens and Maestro E2E test flows (`.maestro/jwt-auth.yaml`).
    - Integrates backend JWT token generation, verification, and rotation endpoints (`POST /auth/register`, `POST /auth/login`, `POST /auth/refresh`, and protected `/v1/me`) across Hono, Express, and NestJS.
  - Add Doctor diagnostics:
    - Validates React Navigation entrypoint integrity (`src/App.tsx` and `src/navigation/RootNavigator.tsx`).
    - Validates JWT auth client presence (`src/auth/jwt-client.ts`).
    - Enforces strict isolation check verifying `JWT_SECRET` and `JWT_REFRESH_SECRET` never leak into mobile client bundles.
  - Add CLI flag `--navigation` and interactive prompts with full backwards compatibility.
