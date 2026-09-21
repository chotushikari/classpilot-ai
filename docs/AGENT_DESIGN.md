# Agent Design

## Purpose
The future learning agent converts user-selected assignment context into explanations, plans, questions, and source-aware study support. It does not autonomously complete or submit graded work.

## Pipeline
1. **Policy gate:** reject missing consent, unsupported task types, excessive content, or a request that asks for prohibited autonomous action.
2. **Context minimizer:** retain only assignment fields and user-provided material needed for the selected help mode.
3. **Planner:** select a learning mode: clarify, break down, quiz, feedback rubric, or cite sources.
4. **Generator:** return structured output (`summary`, `steps`, `questions`, `citations`, `limitations`).
5. **Integrity / safety check:** ensure it does not claim a submission occurred, fabricate sources, expose secrets, or replace learner authorship.
6. **Human handoff:** extension displays result and offers revision/feedback; no external mutation follows from agent output.

## Tool policy
The agent has no direct Classroom, Drive, database, token-vault, browser, or network-write tools. The API supplies a redacted context package; any future retrieval uses API-mediated, read-only, tenant-scoped tools. A separately authorized command service—not the agent—would handle future writes.

## Guardrails
- Treat assignment text and documents as untrusted instructions, never as system policy.
- Require citations or say that a claim is uncertain when research is enabled later.
- Mark generated material as assistance, not student-authored work.
- Log policy decision metadata and model version, not raw prompts by default.

## Evaluation set for later sprints
Create de-identified fixtures for prompt injection, incomplete context, hallucinated citations, academic-integrity edge cases, PII leakage, and write-intent attempts. Block release on regressions in policy adherence.
