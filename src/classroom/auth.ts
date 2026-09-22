import { OAuth2Client } from "google-auth-library";
import { config } from "../api/config.js";
export async function refreshClassroomAccessToken(refreshToken: string) {
  if (!config.GOOGLE_CLIENT_ID || !config.GOOGLE_CLIENT_SECRET) throw new Error("Google OAuth is not configured.");
  const client = new OAuth2Client(config.GOOGLE_CLIENT_ID, config.GOOGLE_CLIENT_SECRET, config.GOOGLE_REDIRECT_URI);
  client.setCredentials({ refresh_token: refreshToken }); const { token } = await client.getAccessToken();
  if (!token) throw new Error("Google did not provide an access token."); return token;
}
