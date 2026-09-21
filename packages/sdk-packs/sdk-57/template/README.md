# Expojet Expo app

This project was generated from the checksum-verified Expo SDK 57 base pack.

## Run

```powershell
pnpm install
Copy-Item .env.example .env
pnpm start -- --clear
```

Open Expo Go and scan the QR code. Configure only public mobile variables in `.env`: values prefixed with `EXPO_PUBLIC_` are embedded in the bundle. Never put database URLs, server secrets, Clerk secret keys, or Convex admin keys in this file. Provider adapters add their required variables to `.env.example`; follow the generated README for provider-specific setup.
