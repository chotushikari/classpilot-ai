import { OAuth2Client } from "google-auth-library";
import { config, readonlyScopes } from "./config.js";

export interface OAuthState { nonce: string; extensionRedirect: string; }
const states = new Map<string, OAuthState>();
export function createGoogleAuthorizationUrl(state: string, nonce: string, extensionRedirect: string) {
  states.set(state, { nonce, extensionRedirect });
  const client = new OAuth2Client(config.GOOGLE_CLIENT_ID, config.GOOGLE_CLIENT_SECRET, config.GOOGLE_REDIRECT_URI);
  return client.generateAuthUrl({ access_type: "offline", prompt: "consent", scope: readonlyScopes, state, nonce, include_granted_scopes: true });
}
export async function redeemGoogleCode(code: string, state: string) {
  const pending = states.get(state); states.delete(state);
  if (!pending) throw new Error("OAuth state was missing or expired");
  const client = new OAuth2Client(config.GOOGLE_CLIENT_ID, config.GOOGLE_CLIENT_SECRET, config.GOOGLE_REDIRECT_URI);
  const { tokens } = await client.getToken(code);
  if (!tokens.id_token) throw new Error("Google did not return an ID token");
  const ticket = await client.verifyIdToken({ idToken: tokens.id_token, audience: config.GOOGLE_CLIENT_ID });
  const payload = ticket.getPayload();
  if (!payload?.sub || payload.nonce !== pending.nonce) throw new Error("Google identity payload was invalid");
  return { pending, subject: payload.sub, email: payload.email, refreshToken: tokens.refresh_token };
}
