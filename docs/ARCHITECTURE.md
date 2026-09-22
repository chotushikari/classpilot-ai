# Architecture

## Context
Chrome Extension is the trusted user interaction surface. Backend API is the policy and identity boundary. Worker is the asynchronous processing boundary. Google Classroom and Drive remain systems of record.

```text
Student -> Chrome extension -> Backend API -> metadata database
                   |                |\-> encrypted token store
                   |                `--> queue --> isolated worker
                   `--> Google Classroom / Drive (consented API calls)
```

## Responsibilities
| Component | Does | Must not do |
| --- | --- | --- |
| Extension | Display consent, initiate OAuth, gather active assignment context, show results | Persist refresh tokens; make unconfirmed writes |
| API | OAuth exchange, token vault access, authorization/policy, sync orchestration, audit events | Execute long-running AI work in request path |
| Worker | Fetch approved jobs, process bounded content, produce structured learning aid | Initiate OAuth; bypass policy; hold browser session |
| Database | Users, connections, metadata, jobs, audit events, retention state | Store raw content indefinitely |
| Token vault | Envelope-encrypted OAuth refresh tokens with rotation/revocation | Be queried directly by extension or worker |

## Key flows
1. **Read sync:** extension shows scope/consent -> API verifies identity and connection -> API reads permitted Classroom metadata -> stores normalized metadata and audit event.
2. **Assistance:** extension submits a selected, minimised context -> API authorizes -> immutable job is queued -> worker returns a learning-oriented artifact -> extension renders it.
3. **Future write (disabled):** extension presents exact target/action -> user confirms -> API re-authorizes scope and ownership -> idempotent command executes -> result/audit is returned. Turn-in is a separate feature flag and cannot run in background.

## Boundaries and deployment
Use independently deployable extension, stateless API replicas, queue consumers, relational database, and managed KMS/secret vault. Place worker egress behind an allowlist; use separate service identities and least-privilege database roles. Version the extension-to-API contract and queue envelope.

## Reliability
Commands carry a user-visible idempotency key. Jobs have attempt count, bounded retry, dead-letter routing, and correlation ID. Google API quota/backoff failures are surfaced as retryable status, never silently retried as a write without an original confirmed intent.

## Classroom projection
The sync service reads active courses and only published coursework, then upserts a per-user local projection. It never makes Classroom mutations. The watcher operates over that normalized projection and its source snapshots rather than over extension state.
