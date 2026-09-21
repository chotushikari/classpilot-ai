import { SignJWT, jwtVerify } from "jose";
import { sessionSecret } from "./config.js";

const key = new TextEncoder().encode(sessionSecret);
export async function signSession(userId: string) {
  return new SignJWT({ scope: "classpilot.readonly" }).setProtectedHeader({ alg: "HS256" }).setSubject(userId).setIssuedAt().setExpirationTime("8h").sign(key);
}
export async function verifySession(token: string): Promise<string> {
  const { payload } = await jwtVerify(token, key, { algorithms: ["HS256"] });
  if (!payload.sub || payload.scope !== "classpilot.readonly") throw new Error("invalid session");
  return payload.sub;
}
