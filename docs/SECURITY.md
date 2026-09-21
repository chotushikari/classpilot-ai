# Security and Privacy Design

## Threat model
Primary threats are stolen OAuth refresh tokens, malicious extension/content-script access, confused-deputy Classroom writes, prompt injection from coursework, cross-user data access, queue replay, and sensitive content in logs/support exports.

## Required controls
| Area | Control |
| --- | --- |
| Identity | OAuth 2.0 with PKCE for extension flow; validate state, nonce, redirect URI, issuer/audience; bind connection to Google subject. |
| OAuth | Incremental least-privilege scopes; encrypted refresh tokens in a vault; rotate/revoke on disconnect; never expose tokens to worker. |
| Extension | Minimal host permissions; strict CSP; no arbitrary remote code; isolate content scripts; authenticated API requests only. |
| Authorization | User/tenant ownership checks on every ID; server-side policy for all mutations; step-up re-confirmation for writes. |
| Data | TLS in transit; KMS-backed encryption at rest; field-level classification; short content retention; deletion workflow. |
| Worker | Separate identity/role; signed queue messages; schema validation; idempotency; outbound allowlist; DLQ. |
| AI | Untrusted-context delimiters, tool denial by default, output validation, policy/evaluation regression tests. |
| Operations | Secret scanning, dependency updates, structured redacted logs, alerting on token access and failed authorization, incident runbook. |
| Abuse control | Per-client API rate limiting, bounded request bodies, and generic external error messages. |

## Google integration posture
Initial capability is read-only and consented. Do not request Drive-wide or Classroom write scopes until a specific user-visible feature needs them, legal/privacy review is complete, and OAuth verification requirements are satisfied. Keep submission/turn-in disabled until its project/ownership constraints are explicitly tested.

## Security release gates
Threat model review, OAuth redirect and scope review, authorization tests, dependency/secret scan, extension permission review, data-deletion test, and a penetration-test plan before public release.

## Deletion behavior
`DELETE /v1/account` is a deletion request, not a synchronous promise that every backup is already erased. It immediately revokes stored OAuth access and records the request; the operational deletion worker must purge dependent content and artifacts according to the published retention SLA.
