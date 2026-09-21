# Data Model

All primary keys are UUIDs; timestamps are UTC; tenant/user identifiers are never inferred from email text.

| Entity | Essential fields | Notes |
| --- | --- | --- |
| `user` | id, Google subject, created_at, deletion_requested_at | Store Google `sub`, not email as identity key. |
| `oauth_connection` | id, user_id, provider, scopes, token_ref, expires_at, revoked_at | `token_ref` points to vault; no token material in DB. |
| `course` | id, user_id, provider_course_id, name, lifecycle, synced_at | Per-user projection of Classroom data. |
| `coursework` | id, course_id, provider_id, title, due_at, state, source_updated_at | Metadata-first; content retention is separately controlled. |
| `submission_reference` | id, coursework_id, provider_submission_id, owner_provider_user_id, state | No write authority implied by this record. |
| `content_blob` | id, owner_type/id, encrypted_uri, classification, expires_at, hash | Optional and short-lived; encrypted object storage. |
| `consent_record` | id, user_id, action, scopes, target_ref, granted_at, revoked_at | Captures consent intent distinct from OAuth grant. |
| `job` | id, user_id, type, context_ref, idempotency_key, state, attempts | Immutable input reference; unique `(user_id, idempotency_key)`. |
| `agent_artifact` | id, job_id, schema_version, encrypted_uri, model_ref, expires_at | Structured result; content retention policy applies. |
| `audit_event` | id, actor_id, action, target_ref, outcome, correlation_id, occurred_at | Append-only; redact sensitive payloads. |

## Relationships and retention
`user` owns `oauth_connection`, `consent_record`, `job`, and `audit_event`. `course` owns `coursework`, which may reference a `submission_reference`. Delete cascades purge content blobs/artifacts and revoke tokens; aggregate operational metrics are de-identified. Define actual retention periods in the privacy policy before production.
