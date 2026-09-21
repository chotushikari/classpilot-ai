# ClassPilot AI

## Scope
This repository begins at Sprint 0. Do not implement assignment solving, automatic submission, or Classroom mutations unless a later approved sprint explicitly authorizes it.

## Architecture
- Chrome extension: user-facing capture, consent, and local session state.
- Backend API: OAuth callback, policy enforcement, durable metadata, and signed work dispatch.
- Worker: isolated, idempotent processing; it never holds browser credentials.

## Security defaults
- Request the narrowest Google OAuth scopes and use incremental authorization.
- Encrypt refresh tokens; never log tokens, assignment content, or student PII.
- Require an explicit user action before any external write or turn-in.
- Keep Drive/ Classroom identifiers separate from content; retain content minimally.

## Quality bar
Add tests for authorization boundaries, idempotency, and data deletion. Document any Google API assumption with a primary Google source and an ADR when it changes architecture.
