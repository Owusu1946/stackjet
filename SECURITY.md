# Security policy

Report vulnerabilities privately through GitHub Security Advisories. Do not open public issues containing credentials or exploit details.

Stackjet classifies `EXPO_PUBLIC_*` values as public bundle configuration. Clerk secret keys, database URLs, authentication secrets, and migration credentials are server-only and must never be written under a generated mobile workspace. Rotate any credential pasted into chat, logs, commits, or issue trackers.

Supported releases receive security fixes on the latest minor line. Generated applications remain responsible for timely Expo, authentication-provider, and database dependency updates.
