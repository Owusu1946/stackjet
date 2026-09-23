---
"@expojet/adapters": patch
---

fix(adapters): resolve dark theme text contrast on generated home page

Update home screen and card components across state, style, and navigation adapters to bind dynamic colors from `useTheme()` (`colors.text`, `colors.textSecondary`, `colors.primary`, `colors.card`, `colors.border`), configure `darkMode: "class"` in Tailwind configuration for NativeWind, and adapt GlassCard fallback background on Android for dark mode.
