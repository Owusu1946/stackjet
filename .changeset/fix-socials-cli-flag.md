---
"create-expojet": patch
---

fix(cli): resolve `--socials` flag to `socialProviders` input

Fix `--socials` command-line option resolution in non-interactive and interactive project creation so that Clerk social sign-in buttons (Google, Apple, Facebook, Microsoft) are properly included when generated from the CLI or the visual Stack Builder. Also preserve `socialProviders` in saved configuration presets.
