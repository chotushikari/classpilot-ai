# ClassPilot AI — Sprint 0 Delivery Report

## Completed foundation
Sprint 0 defines the product requirements, architecture, agent controls, data model, security posture, roadmap, concise contributor guidance, and ADR for a Chrome extension + backend API + isolated worker.

## Architecture decision
Adopt a read-only, student-controlled extension. The backend is the exclusive OAuth, token-vault, authorization, audit, and future command-policy boundary. A queue-driven worker performs bounded, idempotent processing with a separate identity. The learning agent receives minimized context and has no direct Classroom, Drive, browser, database, or write tools.

## Google platform decision
No turn-in capability is included. Google Classroom `turnIn` is restricted to the student owner and must be invoked by the OAuth client project that created the coursework or an add-on attachment on it. It therefore cannot be treated as a generic way to submit arbitrary teacher-created assignments. The detailed constraint register contains primary Google documentation links.

## Blockers / release gates
1. Configure Google Cloud/OAuth consent and validate redirect/scopes.
2. Verify target-school API eligibility, licensing, and admin policy.
3. Approve privacy retention, deletion SLA, and student-consent posture.
4. Select/assess the database, queue, KMS/token vault, and model provider.
5. Approve academic-integrity policy and pilot criteria.
6. Treat future turn-in as conditional on concrete assignment/client-project ownership tests.

## Exact first implementation task
Implement a Chrome extension OAuth 2.0 Authorization Code + PKCE sign-in flow that sends the authorization code to a backend callback, stores the resulting refresh token only in an encrypted server-side vault, and requests only `openid`, `email`, `profile`, and `https://www.googleapis.com/auth/classroom.student-submissions.me.readonly`; include tests for PKCE/state validation, token non-exposure to the extension, disconnect/revocation, and read-only scope enforcement.

## Repository artifact map
- `AGENTS.md`: contributor guardrails.
- `docs/PRD.md`, `ARCHITECTURE.md`, `AGENT_DESIGN.md`, `DATA_MODEL.md`, `SECURITY.md`, and `ROADMAP.md`: Sprint 0 foundation.
- `docs/adr/0001-extension-api-worker.md`: architectural decision record.
- `docs/GOOGLE_API_CONSTRAINTS.md`: sourced Classroom and Drive constraint register.
- `docs/ARCHITECTURE_DECISION_REPORT.md`: complete decision report.
