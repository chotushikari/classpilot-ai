# ADR 0001: Use extension, policy API, and isolated worker

- Status: Accepted (Sprint 0)
- Date: 2026-09-22

## Context
ClassPilot needs a user-facing browser experience, Google OAuth/authorization enforcement, and asynchronous processing of selected learning context. Combining these duties in an extension would expose durable credentials and make long-running work unreliable. Combining policy and workers would weaken least privilege and complicate retries.

## Decision
Use three components:

1. A Chrome extension for consented interaction and local ephemeral state.
2. A stateless backend API as the only OAuth, authorization, token-vault, audit, and command-policy boundary.
3. A queue-driven worker with a separate identity for bounded, idempotent processing.

The agent runs within the worker but receives only an API-created minimized context package. It has no direct Google write tool. All mutation-capable integrations remain disabled by policy during initial releases.

## Consequences
This adds queue, observability, and contract-versioning overhead, but permits independent scaling, failure isolation, a small extension trust surface, and auditable authorization. It also keeps future Classroom writes distinct from content generation and makes a read-only MVP viable.

## Alternatives rejected
- **Extension only:** unsuitable for refresh-token protection, policy enforcement, and reliable background work.
- **API performs all work synchronously:** poor latency/failure isolation and risks request timeouts.
- **Worker directly calls Google APIs:** violates centralized authorization and increases confused-deputy risk.
