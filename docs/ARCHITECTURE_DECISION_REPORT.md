# Sprint 0 Architecture Decision Report

## Decision
Proceed with a read-only, student-controlled Chrome extension backed by a policy API and isolated worker. The initial value is learning support from consented assignment context; not task completion or submission automation.

## Evidence
Google's API permits `turnIn`, but it is not a general automation privilege: the caller must own the student submission and the OAuth client project must have created the coursework or matching add-on attachment. The narrower read-only Classroom scopes do not authorize turn-in. See the linked primary sources in [Google API constraints](GOOGLE_API_CONSTRAINTS.md).

## Blockers / gates
1. Establish a Google Cloud project, OAuth consent-screen configuration, approved redirect design, and scope-verification plan.
2. Confirm target-school Classroom API eligibility/licensing and administrator policies.
3. Decide legal/privacy retention periods, deletion SLA, and student age/consent posture.
4. Select managed database, queue, KMS/token vault, and model provider; complete their security review.
5. Define academic-integrity policy and pilot success/failure criteria.
6. Do not plan turn-in for arbitrary teacher-created assignments: its ownership/client-project prerequisite is a hard platform constraint.

## Exact first implementation task
**Implement a Chrome extension OAuth 2.0 Authorization Code + PKCE sign-in flow that sends the authorization code to a backend callback, stores the resulting refresh token only in an encrypted server-side vault, and requests only `openid`, `email`, `profile`, and `https://www.googleapis.com/auth/classroom.student-submissions.me.readonly`; include tests for PKCE/state validation, token non-exposure to the extension, disconnect/revocation, and read-only scope enforcement.**

## Decision status
Accepted for Sprint 0. Revisit when a concrete write capability is proposed, with an additional ADR and Google sandbox validation.
