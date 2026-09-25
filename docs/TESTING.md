# ClassPilot testing runbook

## Fast local test (no Google account)

From the repository root:

```powershell
npm install
npm run check
npm run dev:api
```

Then load `extension/` from `chrome://extensions` with Developer mode enabled and choose **Explore a local demo**. Select the demo assignment, confirm consent, create the learning aid, and download the generated DOCX/PDF files.

The end-to-end fixture is also covered by `tests/demo-flow.test.ts`; `npm run check` runs it together with the security and artifact tests.

## Real Google Classroom test account

1. Create a Google Cloud project and enable the Classroom API.
2. Configure an OAuth web client and the redirect URI documented in `docs/GOOGLE_OAUTH.md`.
3. Copy `.env.example` to `.env` and set `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `SESSION_SECRET`, and `TOKEN_ENCRYPTION_KEY`.
4. Keep `DEMO_MODE=false` only after `DATABASE_URL` points to a configured PostgreSQL instance.
5. Set the API origin in `extension/config.js`, reload the unpacked extension, and connect a test student account.
6. Create or update a test assignment in an enabled course. The system should detect metadata changes, create one idempotent job, produce a reviewable draft packet, and expose the artifact download controls.

## What to verify manually

- A repeated poll does not create duplicate jobs.
- Changing only an attachment causes a new fingerprint and supersedes the previous work.
- A user cannot download another user’s artifact.
- Unsupported or inaccessible materials become review questions rather than fabricated content.
- The generated packet contains a requirements checklist and an explicit student-review notice.
- No Classroom mutation or turn-in request is sent.

## Production gap

The current local artifact store is memory-backed for demo/testing. Before a public deployment, replace it with encrypted object storage, add signed short-lived download URLs, and run the deletion/retention workflow against both metadata and file bytes.
