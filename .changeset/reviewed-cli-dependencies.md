---
"create-expojet": patch
---

Pin the CLI's direct runtime dependencies to the versions already resolved in the reviewed workspace lockfile, instead of resolving the latest versions at installation time. This does not pin every transitive or generated-app dependency.
