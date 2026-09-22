# ClassPilot AI Chrome Extension

## Local demo

1. Start the API from the repository root with `npm run dev:api`.
2. Open `chrome://extensions`, enable Developer mode, and choose **Load unpacked**.
3. Select this `extension/` directory.
4. Open the extension and choose **Explore a local demo**.

The demo exercises coursework selection, explicit consent, learning-mode selection, job polling, and the read-only integrity boundary. It does not contact Google.

## Google mode

Follow `docs/GOOGLE_OAUTH.md` first. Set `API_ORIGIN` in `config.js` if your API is not on `http://localhost:3000`, then reload the unpacked extension after changing files.

The extension stores only the short-lived signed ClassPilot session in `chrome.storage.session`; it never receives a Google refresh token.
