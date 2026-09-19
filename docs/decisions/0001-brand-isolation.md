# ADR 0001: Centralized Brand Isolation

## Status
Accepted

## Context
Market research identified an existing unrelated enterprise product named "StackJET". To avoid trademark conflicts, search collisions, and legal exposure prior to professional trademark clearance, the product name must not be hardcoded throughout generator logic, templates, or schemas.

## Decision
All user-facing product branding, CLI executable labels, taglines, and marketing strings are strictly centralized in a dedicated package:
```text
packages/brand/src/index.ts
```

Generator templates, adapters, and CLI commands must import from `@expojet/brand` rather than using literal string identifiers.

## Consequences
- The product name can be replaced across the entire ecosystem in a single commit without modifying generator logic or schema validators.
- Prevents premature public brand commitment while preserving development velocity.
