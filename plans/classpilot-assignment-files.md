# ClassPilot AI — Assignment File Automation Blueprint

Status: draft for adversarial review  
Product goal: when a new Google Classroom assignment appears, ClassPilot detects it, understands its requirements, and creates a polished, structured study/draft file for the student to review. The system never silently submits, edits Classroom, impersonates the student, or presents generated work as verified academic truth.

## Current state

The repository already contains a working TypeScript API, demo worker, read-only Google Classroom client, OAuth/session vault, polling/snapshot primitives, idempotent learning jobs, a Manifest V3 popup, security headers/rate limits, tests, packaging, and an updated UI demo. The current worker generates planning scaffolding only. It does not yet ingest Classroom attachments into a typed assignment specification or generate DOCX/PDF artifacts.

Known constraints: the extension cannot be the durable watcher; Google scopes and turn-in capabilities are limited; real OAuth and PostgreSQL are not configured locally; generated content must remain user-reviewed and attributable.

## Dependency graph

```text
1 Product contract + data model
  ├── 2 Assignment intake + attachment manifest
  │     └── 3 Structured draft planner
  │           └── 4 DOCX/PDF artifact engine
  ├── 5a Durable watcher + job orchestration
  │     └── 5b Pipeline wiring: watcher → intake → planner → artifacts
  │           └── 6 Extension review and artifact UX
  └── 7 Security/evaluation/deployment gate
```

Steps 2 and 5 can proceed in parallel after Step 1. Step 4 depends on the typed planner output. Step 6 depends on the API contract from Steps 4–5. Step 7 is a release gate and runs after all product paths exist.

## Step 1 — Lock the focused MVP contract and persistence model

Model tier: strongest. Mode: serial.

### Context brief

The existing PRD still describes a study companion and intentionally excludes final assignment solving. Update the product contract so “assignment files” means structured, reviewable drafts/study packets generated from the assignment requirements and permitted user context. Keep Classroom and Drive writes disabled. Preserve tenant isolation, consent, deletion, and audit requirements.

### Tasks

1. Add a product contract documenting supported inputs, output types, review states, unsupported cases, and academic-integrity boundaries.
2. Extend shared types and database design for assignment specifications, artifact records, artifact validation status, source references, and review state.
3. Define stable idempotency keys: `user + Classroom coursework id + source update time + generator version`.
4. Add API response schemas for job progress and artifact metadata without returning raw secrets or unbounded content.

### Verification

`npm run check`; schema validation tests; authorization tests proving one user cannot read another user’s artifact.

### Exit criteria

The contract is explicit enough that a fresh engineer can implement intake and artifact generation without assuming auto-submission or unrestricted answer generation.

### Rollback

Documentation and additive schema changes only; revert the migration and type additions together if the contract changes.

## Step 2 — Build universal assignment intake

Model tier: default. Mode: parallel with Step 5 after Step 1.

### Context brief

`src/classroom/sync.ts` currently retrieves published coursework metadata. The typed `AssignmentSpecification` exists but is not populated from real coursework materials. Add an intake pipeline that preserves source references, detects requested deliverables, and treats attachment text as untrusted input.

### Tasks

1. Add a Classroom material/attachment manifest adapter with pagination, file IDs, MIME types, URLs, and bounded metadata.
2. Add parser interfaces and safe text extraction for supported text/PDF/DOCX inputs; unsupported or oversized files become explicit unresolved items.
3. Produce a validated `AssignmentSpecification` with instructions, rubric criteria, deliverables, constraints, validation plan, and unresolved questions.
4. Add prompt-injection markers and tests ensuring attachment text cannot expand scopes or override policy.

### Verification

Fixture tests for plain text, rubric, PDF metadata, image/unsupported files, malformed model output, oversized input, and missing permissions.

### Exit criteria

Every detected assignment either yields a validated specification with source references or a truthful actionable blocked state.

### Rollback

Keep the existing metadata-only job path behind a feature flag; disable intake without losing snapshots.

## Step 3 — Add structured draft planning

Model tier: strongest for schema/prompt design, default for implementation.

### Context brief

The current `safeArtifact` function emits generic planning bullets. Replace it with a deterministic planner consuming the validated specification and an explicit support mode. It may create outlines, checklists, reflection prompts, citation placeholders, and section scaffolds, but must not fabricate citations or claim correctness.

### Tasks

1. Create typed draft sections, checklist items, source placeholders, and validation tasks.
2. Add provider-neutral planner interface with a deterministic fallback for demo mode.
3. Require every generated section to retain source IDs or be marked as a student-authored placeholder.
4. Persist planner version and unresolved questions on the job.

### Verification

Golden fixtures across CS, math, humanities, science, and business; rubric coverage and source-traceability assertions.

### Exit criteria

A new assignment can produce a reviewable, subject-neutral structured draft plan without pretending to be a finished submission.

### Rollback

Retain `safeArtifact` as a fallback generator version and make planner selection configuration-driven.

## Step 4 — Generate and validate assignment files

Model tier: default. Mode: serial after Step 3.

### Context brief

Students asked for files, not just chat output. Introduce deterministic DOCX and PDF generation first, with safe filenames, isolated output directories, and post-generation reopen checks. The files should be polished templates/draft packets that make the required structure obvious.

### Tasks

1. Add DOCX and PDF generators consuming typed draft sections.
2. Include title page, assignment metadata, requirements checklist, structured sections, source/reference placeholders, and “student review required” notice.
3. Validate MIME type, file size, page/document structure, and reopenability.
4. Store artifact metadata and expose a bounded download/preview response.
5. Choose and pin the document libraries, add object-storage boundaries, signed download expiry, tenant binding, content disposition, retention, deletion, and restart behavior before implementation.

### Verification

Generate representative fixtures and reopen every artifact; assert no path traversal, unsafe filename, or cross-user access.

### Exit criteria

The API can produce a valid, downloadable DOCX/PDF draft packet tied to one assignment job.

### Rollback

Keep artifacts ephemeral and retain job-level structured output if generation fails.

## Step 5a — Make detection durable and automatic

Model tier: default. Mode: parallel with Step 2 after Step 1.

### Context brief

The extension must not stay open for automation. The scheduler/worker must poll enabled courses, fingerprint meaningful updates including attachment/material changes, enqueue exactly one job per update, recover leases, and record transitions.

### Tasks

1. Split watcher foundation from pipeline execution; this step owns only polling, fingerprints, leases, retries, and transitions.
2. Add attachment/material fingerprints so an attachment-only update cannot be missed.
3. Add configurable polling interval, due-date priority, retry/backoff, crash recovery, and stale lease recovery with `lease_until`/heartbeat fields.
4. Add course enable/disable settings and a local fixture that simulates new and changed coursework without OAuth.
5. Notify the extension/API of progress without exposing assignment content in logs.

### Verification

Duplicate polling, restart, rate limit, token expiry, changed attachment, and worker-crash tests.

### Exit criteria

One new assignment produces one durable job and a recoverable pipeline trigger even if the worker restarts or the popup is closed. Artifact production is verified in Step 5b.

### Rollback

Disable the watcher feature flag and continue serving manually requested learning jobs.

## Step 5b — Wire the automatic assignment-file pipeline

Model tier: default. Mode: serial after Steps 2, 3, 4, and 5a.

### Context brief

This is the user’s core “as soon as” moment. Connect a detected coursework update to bounded intake, the structured draft planner, deterministic artifact generation, validation, and a truthful partial/blocked state. The worker must supersede older artifacts when the source assignment changes rather than silently mixing versions.

### Tasks

1. Wire watcher events to assignment specification creation, draft planning, and artifact generation.
2. Add explicit generation modes: `study_packet` and `reviewable_draft`; do not add completed-answer mode without a separate approved product decision.
3. Persist source references, artifact status, generator version, supersession links, and validation results.
4. Handle unsupported/deleted/shared Drive files, expired tokens, MIME spoofing, oversized files, and partial success without claiming completion.
5. Add provider/BYOK consent, quota/cost limits, and a human-review gate before download/use.

### Verification

End-to-end fixture: new assignment → one job → one validated artifact set; update fixture supersedes the old artifact; failures produce `blocked` or `partial` states with actionable messages.

### Exit criteria

The backend can truthfully say an assignment was detected and a structured, reviewable file was prepared, with source coverage and unresolved questions visible.

### Rollback

Disable automatic generation and keep the manual learning-job path; never delete the source snapshot or audit trail.

## Step 6 — Upgrade the extension review experience

Model tier: default. Mode: serial after Steps 4–5.

### Context brief

The extension now has a polished onboarding popup and demo flow. Add job progress, artifact cards, preview/download actions, source coverage, unresolved questions, and clear review-before-use language. Keep all external writes behind explicit future approvals.

### Tasks

1. Add sync status and “new assignment detected” states.
2. Show artifact type, validation status, generated time, and source coverage.
3. Add accessible preview/download affordances and actionable error states.
4. Add a user setting for generation mode and retention, defaulting to conservative values.

### Verification

Playwright discovery/rehearsal, keyboard navigation, loading/error/empty states, and extension packaging smoke test.

### Exit criteria

A student can connect, see a detected assignment, review the generated file metadata, and download the draft without developer intervention.

### Rollback

Fall back to the current popup learning-aid flow while preserving server-side jobs.

## Step 7 — Adversarial security, evaluation, and release gate

Model tier: strongest. Mode: serial final gate.

### Context brief

This product handles student work, OAuth tokens, and untrusted attachments. A polished demo is not enough. Validate tenant isolation, prompt-injection resistance, artifact safety, provider failures, deletion, and truthful state reporting.

### Tasks

1. Run dependency and secret scans; investigate findings rather than auto-fixing heuristics blindly.
2. Add golden evaluation metrics for specification completeness, artifact validity, source traceability, recovery, and duplicate prevention.
3. Test deletion and retention against database and generated artifacts.
4. Add adversarial fixtures for obfuscated/multilingual/OCR/image prompt injection, archive bombs, MIME spoofing, path traversal, oversized files, external links, and generated-document safety.
5. Document local demo, OAuth setup, Drive scope choice, polling-latency SLA, deployment, limitations, and manual review policy.

### Verification

`npm run check`, `npm audit --omit=dev`, security tests, fixture evaluation, extension package inspection, and manual OAuth test-account run.

### Exit criteria

The product can truthfully claim: “new assignments can be detected and turned into structured, reviewable draft files,” with known unsupported cases and no silent Classroom mutations.

### Rollback

Release only the read-only/manual-review mode if any automated write or isolation gate fails.

## Anti-pattern catalog

- Do not turn the Chrome popup into the scheduler.
- Do not call generated output a completed or correct submission.
- Do not fabricate citations, grades, rubrics, or attachment contents.
- Do not execute generated code on the API host.
- Do not persist raw assignment content longer than the retention policy requires.
- Do not retry irreversible Classroom actions or add write scopes to “make the demo work.”
- Do not auto-fix scanner findings that are unverified lockfile heuristics.
- Do not fetch arbitrary attachment URLs or shared Drive files without an explicit, scoped adapter decision.
- Do not retain generated artifacts beyond the documented deletion/retention SLA.

## Plan mutation protocol

If a future API, provider, or policy change invalidates a step, mark the step `blocked`, record the evidence and affected dependents here, then insert a replacement step with new verification and rollback criteria. Never silently reorder dependencies or widen permissions.
