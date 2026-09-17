# Migration policy

Generator releases may add files and manifest fields without rewriting user-owned application code. Breaking template or adapter changes require a major release, migration notes, and a dry-run preview before future automated upgrades.

Database migrations are forward-only, committed SQL. Use the direct Neon connection for release migrations and the pooled connection for runtime traffic. Back up production data before destructive schema changes; never run migrations from the mobile client.
