# ClassPilot AI — Product Requirements (Sprint 0)

## Product intent
ClassPilot AI is a student-controlled study companion that helps a learner understand work surfaced from Google Classroom. It must support learning, attribution, and user agency; it is not an autonomous assignment-completion or submission system.

## Users and jobs
| User | Job | Sprint-0 outcome |
| --- | --- | --- |
| Student | Understand an assignment and organize next steps | A consented, read-only assignment context can be represented safely. |
| Teacher / institution | Preserve academic integrity and classroom control | No hidden writes, no impersonation, clear auditability. |
| Product operator | Operate a compliant integration | Clear scopes, data boundaries, and release gates. |

## In scope
Architecture, policy, data model, API-constraint research, delivery roadmap, and decision record for a Chrome extension plus backend plus worker.

## Explicitly out of scope
Solving assignments, generating final answers for graded work, automatic attachment changes, creating coursework, grading, auto-turn-in, production OAuth setup, and any UI or service implementation.

## Product principles / requirements
1. The student sees and approves every material action.
2. Start read-only: Classroom context is imported only after consent.
3. Assistance favors explanation, planning, citations, and learner reflection over answer replacement.
4. A Classroom or Drive write requires a separate, just-in-time confirmation and an auditable event.
5. A user can disconnect, export, and delete their data.

## Success measures for later validation
- 100% of write intents have actor, consent, scope, target, and result recorded.
- 0 background turns-in or attachment mutations.
- 95%+ of assignment-context syncs communicate a useful failure state on permission/rate-limit errors.
- Deletion requests remove persisted content within the stated retention SLO.

## Non-functional requirements
Least privilege, privacy-by-design, accessible extension UI, resilient retries without duplicate writes, and observability that excludes sensitive payloads.

## Acceptance gate for Sprint 0
The artifacts in this repository resolve system boundaries, protected data, known API constraints, risks, and a single implementation-ready next task. No production code is required.
