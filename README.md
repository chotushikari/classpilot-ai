# ClassPilot AI

ClassPilot is a privacy-first, read-only learning companion for Google Classroom. This repository contains a production-shaped MVP: Chrome extension UI, OAuth/API boundary, PostgreSQL schema, and a queue worker. Assignment completion, grade changes, attachment writes, and turn-in remain intentionally disabled.

## Start locally

1. Copy `.env.example` to `.env` and supply Google OAuth values. `DEMO_MODE=true` permits a local demo identity without Google calls; it is prohibited in production. Set `CHROME_EXTENSION_ID` before a production build to lock CORS to the published extension.
2. Create the database and apply `db/schema.sql`.
3. Run `npm install`, `npm run dev:api`, and `npm run dev:worker` in separate terminals.
4. Load `extension/` as an unpacked Chrome extension. Set its `API_ORIGIN` in `extension/config.js` if needed.

## Security model

- The extension never receives a Google refresh token.
- The backend owns OAuth exchange, token encryption, authorization, consent, auditing, and job enqueueing.
- The worker consumes only signed/minimized jobs and has no Google write path.
- The only Google Classroom scope requested is `classroom.student-submissions.me.readonly` (plus OpenID identity scopes).

See `docs/` for product decisions and `docs/GOOGLE_API_CONSTRAINTS.md` for primary-source integration constraints.
