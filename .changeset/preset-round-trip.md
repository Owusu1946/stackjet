---
"@expojet/schemas": patch
"create-expojet": patch
---

Preserve every create choice when saving a preset

`--save-preset` wrote a preset that omitted `analytics`, `haptics` and `sdk`, and the interactive
"save this configuration" prompt omitted `haptics` and `sdk`. Because the preset schema filled in
defaults for the missing keys, the file on disk claimed values the user never chose, and re-running
`expojet my-app --preset mypreset` generated a different stack than the one that was saved.

Both call sites now share one helper that serialises the whole resolved input, so the two paths
cannot drift again.
