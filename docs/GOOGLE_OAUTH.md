# Google OAuth Connection and Test Setup

## Required one-time setup
1. In Google Cloud Console, create/select a project and enable Google Classroom API.
2. Configure the OAuth consent screen and add your Google account as a test user while the app is in testing.
3. Create a Web application OAuth client. Add `http://localhost:3000/v1/auth/google/callback` as an authorized redirect URI.
4. Copy `.env.example` to `.env`; set `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, a unique 32+ character `SESSION_SECRET`, and a base64-encoded 32-byte `TOKEN_ENCRYPTION_KEY`. Keep `DEMO_MODE=false` for the real test.
5. Load the unpacked extension and set `CHROME_EXTENSION_ID` in `.env` to its fixed development extension ID. Add its `https://<id>.chromiumapp.org/oauth2` redirect URI to the OAuth client.

## Read-only test
Start PostgreSQL/API/worker, sign in from the extension, then call `POST /v1/classroom/sync` with the extension session. Expected result is a count of visible courses/coursework. This requests only `classroom.courses.readonly`, `classroom.coursework.me.readonly`, and `classroom.student-submissions.me.readonly`; it cannot write, attach, or turn in.

## Security
Never paste client secrets or token values into chat or source control. A Google OAuth client secret is a credential; store it only in the ignored local `.env` or a production secret manager.
