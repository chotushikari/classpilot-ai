# Roadmap

| Sprint | Goal | Exit criteria |
| --- | --- | --- |
| 0 (this work) | Product and technical foundation | Planning docs, Google constraint register, ADR, and one implementation task approved. |
| 1 | Read-only identity and Classroom metadata vertical slice | OAuth/PKCE, consent UI, minimal scopes, course/coursework sync, audit tests. |
| 2 | Persistent assignment watcher | Poll course work independently of Chrome, fingerprint snapshots, deduplicate jobs, honor due-date priority, and test restarts/rate limits. |
| 3 | Drive document selection and content controls | Picker-mediated selection, scoped retrieval, retention/deletion, user-visible errors. |
| 4 | Reliability and institutional readiness | Telemetry, rate-limit behavior, accessibility, security review, pilot controls. |
| Later / conditional | Any Classroom mutation | Separate PRD/ADR, scope verification, ownership tests, explicit-confirmation UX, rollout approval. |

## Dependency gates
Google Cloud project and OAuth consent configuration, eligibility/license validation for target institutions, privacy terms/retention policy, model-provider risk review, and pilot-partner approval are required before a real-user pilot. A turn-in feature additionally requires proof that course work/add-on ownership and OAuth-client-project conditions are met for every target assignment.
