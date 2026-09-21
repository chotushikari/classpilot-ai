import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
import { config, sessionSecret } from "./config.js";

/** Envelope format suitable for a KMS-wrapped data key. In production provide TOKEN_ENCRYPTION_KEY from KMS. */
export class TokenVault {
  constructor(private readonly key: Buffer) {
    if (key.length !== 32) throw new Error("Token encryption key must be 32 bytes");
  }
  encrypt(secret: string): string {
    const iv = randomBytes(12); const cipher = createCipheriv("aes-256-gcm", this.key, iv);
    const ciphertext = Buffer.concat([cipher.update(secret, "utf8"), cipher.final()]); const tag = cipher.getAuthTag();
    return Buffer.concat([iv, tag, ciphertext]).toString("base64url");
  }
  decrypt(envelope: string): string {
    const raw = Buffer.from(envelope, "base64url"); const iv = raw.subarray(0, 12); const tag = raw.subarray(12, 28); const ciphertext = raw.subarray(28);
    const decipher = createDecipheriv("aes-256-gcm", this.key, iv); decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString("utf8");
  }
}

const material = config.TOKEN_ENCRYPTION_KEY ? Buffer.from(config.TOKEN_ENCRYPTION_KEY, "base64") : createHash("sha256").update(sessionSecret).digest();
export const tokenVault = new TokenVault(material);
