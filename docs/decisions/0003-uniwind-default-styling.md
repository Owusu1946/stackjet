# ADR 0003: Uniwind as Default Styling Foundation

## Status
Accepted

## Context
Tailwind CSS utility styling is the preferred workflow for modern React Native teams. However, NativeWind v5 remains in release-candidate status with evolving configuration requirements, and NativeWind v4 requires a Babel compiler preset that adds build overhead and potential conflicts with Expo SDK 57’s Metro compiler pipeline.

## Decision
1. Adopt Uniwind as the default Tailwind styling solution for Stackjet SDK 57 projects.
2. Provide standard React Native `StyleSheet` as a zero-dependency alternative.
3. Configure Uniwind through Metro wrapper composition (`withUniwind`) as the outermost wrapper, avoiding Babel compiler alterations.

## Consequences
- Native Tailwind 4 compatibility out of the box with zero Babel preset complexity.
- Clean separation between pure CSS utility styles (`src/global.css`) and component layouts.
- Preserves full compatibility with Expo Router and Metro fast refresh.
