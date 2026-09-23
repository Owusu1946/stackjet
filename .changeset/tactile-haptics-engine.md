---
"@expojet/schemas": minor
"@expojet/adapters": minor
"@expojet/core": patch
"create-expojet": minor
---

Add Tactile Haptics Engine (expo-haptics) with pre-wired mobile feedback

Introduces tactile haptics powered by `expo-haptics` across generated Expo SDK 57 applications:

- Adds `haptics: z.boolean().default(true)` to `CreateInput` and `manifest.features`
- Generates `src/haptics/index.ts` with cross-platform safe `selection`, `light`, `medium`, `heavy`, `success`, `warning`, and `error` tactile vibration methods
- Pre-wires haptics into generated buttons (`CounterCard`), theme switching (`ThemeToggle`), and tab switching (`tabPress` listener)
- Generates safe no-op stubs when `--no-haptics` is specified, requiring zero dependencies while preserving component code compatibility
- Adds doctor check for `expo-haptics` module and dependency when enabled
- Exposes `--haptics` and `--no-haptics` CLI flags, interactive prompt option, and Stack Builder toggle
