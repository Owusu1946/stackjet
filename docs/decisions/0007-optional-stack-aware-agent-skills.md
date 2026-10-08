# Optional stack-aware agent skills

## Context

Developers want relevant coding-agent guidance after scaffolding, without making
generated files depend on network responses or committing to one coding agent.
Global installation must not mutate the project. Existing agent instructions
belong to the user and cannot be overwritten to make setup succeed.

## Decision

The CLI owns a typed catalog of reviewed sources, immutable Git revisions,
licenses, exact skill names/paths, provenance, and pure applicability rules.
Selection, confirmation, downloads, subprocesses, and reporting live in the CLI.
Core owns only filesystem guards, hashing, atomic directory copies, and record
writes. Adapters and generation input are unchanged.

Download each selected source once into an exclusively created temporary
workspace. Check out its exact revision, validate metadata and licenses, then
invoke an exact-version skills installer against local paths in isolated staging
with explicit names and copy mode. Validate the resulting directories again.
Never run skill scripts. Only Expojet's guarded copier touches actual agent paths.

Project and global mappings are separate. Deduplicate physical target paths.
Use per-directory exclusive locks and unique sibling staging directories. Skip
matching hashes; preserve differing content. Serialize provenance record merges,
and keep global records outside the project. A stale lock causes a reported
failure, not automatic deletion of another process's state.

Installation is optional, Skip is the interactive default, and `--yes` alone is
not consent. Post-create failures cannot invalidate a successfully generated app.
Standalone failures remain nonzero. Dry-run selection is read-only and offline.

## Alternatives and consequences

Better-T-Stack's [skills setup](https://github.com/AmanVarshney01/create-better-t-stack/blob/main/apps/cli/src/helpers/addons/skills-setup.ts)
informed stack-based curation and agent/scope selection. We do not delegate live
destinations to a floating installer, recommend an entire source repository, or
print unconditional success after partial failures.

Pinned sources trade freshness for reviewability. Adding a source requires a
license, metadata, compatibility, and destination review. Missing coverage is
visible rather than invented. Skills are instructions, not a security boundary
or a runtime certification; users still review agent output against installed
dependency versions. No automatic updating, replacement, removal, MCP setup, or
builder UI is introduced.
