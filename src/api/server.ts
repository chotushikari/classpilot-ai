import { randomBytes, randomUUID } from "node:crypto";
import express, { type NextFunction, type Request, type Response } from "express";
import { config } from "./config.js";
import { createGoogleAuthorizationUrl, redeemGoogleCode } from "./google.js";
import { jobRequestSchema, rejectMutation } from "./policy.js";
import { repository } from "./repository.js";
import { signSession, verifySession } from "./session.js";
import { safeArtifact } from "../worker/processor.js";

const app = express();
app.disable("x-powered-by");
app.use(express.json({ limit: "32kb" }));
app.use((req, res, next) => {
  const origin = req.headers.origin;
  const allowedExtensionOrigin = config.CHROME_EXTENSION_ID ? `chrome-extension://${config.CHROME_EXTENSION_ID}` : undefined;
  const developmentExtension = config.NODE_ENV !== "production" && origin?.startsWith("chrome-extension://");
  if (origin && (origin === config.APP_ORIGIN || origin === allowedExtensionOrigin || developmentExtension)) res.setHeader("Access-Control-Allow-Origin", origin);
  res.setHeader("Vary", "Origin"); res.setHeader("Access-Control-Allow-Headers", "Authorization, Content-Type, Idempotency-Key");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS");
  if (req.method === "OPTIONS") return res.sendStatus(204); next();
});
app.use((_req, res, next) => {
  res.setHeader("Content-Security-Policy", "default-src 'none'; frame-ancestors 'none'; base-uri 'none'");
  res.setHeader("X-Content-Type-Options", "nosniff"); res.setHeader("Referrer-Policy", "no-referrer");
  res.setHeader("Permissions-Policy", "geolocation=(), microphone=(), camera=()"); next();
});
app.use((req, res, next) => {
  if (rejectMutation(req.path)) return res.status(403).json({ error: "Classroom mutations are disabled by product policy." });
  next();
});

type AuthedRequest = Request & { userId?: string; correlationId?: string };
function requestId(req: AuthedRequest, _res: Response, next: NextFunction) { req.correlationId = randomUUID(); next(); }
async function requireUser(req: AuthedRequest, res: Response, next: NextFunction) {
  try {
    const token = req.header("Authorization")?.replace(/^Bearer\s+/i, "");
    if (!token) throw new Error("missing"); req.userId = await verifySession(token); next();
  } catch { res.status(401).json({ error: "A valid session is required." }); }
}
app.use(requestId);

app.get("/healthz", (_req, res) => res.json({ status: "ok", mode: config.DEMO_MODE }));

app.get("/v1/auth/demo", async (_req, res) => {
  if (config.DEMO_MODE !== "true") return res.sendStatus(404);
  const user = await repository.upsertUser("demo-student", "student@example.test");
  res.json({ session: await signSession(user.id), demo: true });
});

app.get("/v1/auth/google/start", (req, res) => {
  const extensionRedirect = String(req.query.redirect ?? "");
  if (!extensionRedirect.startsWith("https://") || !extensionRedirect.includes(".chromiumapp.org/")) return res.status(400).json({ error: "A Chrome identity redirect URL is required." });
  if (!config.GOOGLE_CLIENT_ID || !config.GOOGLE_CLIENT_SECRET) return res.status(503).json({ error: "Google OAuth is not configured." });
  const state = randomBytes(32).toString("base64url"); const nonce = randomBytes(32).toString("base64url");
  res.json({ authorizationUrl: createGoogleAuthorizationUrl(state, nonce, extensionRedirect) });
});

app.get("/v1/auth/google/callback", async (req, res) => {
  try {
    const code = String(req.query.code ?? ""); const state = String(req.query.state ?? "");
    if (!code || !state) throw new Error("Missing OAuth callback values");
    const data = await redeemGoogleCode(code, state); const user = await repository.upsertUser(data.subject, data.email);
    // Refresh tokens must be encrypted and stored in the vault-backed oauth_connection table by the production repository.
    await repository.audit(user.id, "oauth.connected", "google", "success", randomUUID());
    const session = await signSession(user.id);
    res.redirect(`${data.pending.extensionRedirect}#session=${encodeURIComponent(session)}`);
  } catch (error) { res.status(400).type("text/plain").send(`Sign-in failed: ${(error as Error).message}`); }
});

app.get("/v1/coursework", requireUser, async (req: AuthedRequest, res) => {
  const items = await repository.listCoursework(req.userId!);
  await repository.audit(req.userId, "coursework.list", undefined, "success", req.correlationId!);
  res.json({ items });
});

app.post("/v1/learning-jobs", requireUser, async (req: AuthedRequest, res) => {
  const parsed = jobRequestSchema.safeParse({ ...req.body, idempotencyKey: req.header("Idempotency-Key") ?? req.body?.idempotencyKey });
  if (!parsed.success) return res.status(400).json({ error: "Invalid learning request", details: parsed.error.flatten() });
  const job = await repository.createJob({ userId: req.userId!, courseworkId: parsed.data.courseworkId, mode: parsed.data.mode, context: parsed.data.context, idempotencyKey: parsed.data.idempotencyKey });
  await repository.audit(req.userId, "learning_job.create", job.id, "success", req.correlationId!);
  res.status(job.state === "queued" ? 202 : 200).json({ job });
});

app.get("/v1/learning-jobs/:id", requireUser, async (req: AuthedRequest, res) => {
  const job = await repository.getJob(req.userId!, String(req.params.id));
  if (!job) return res.sendStatus(404); res.json({ job });
});

app.delete("/v1/connection", requireUser, async (req: AuthedRequest, res) => {
  await repository.revokeConnection(req.userId!); await repository.audit(req.userId, "oauth.disconnect", "google", "success", req.correlationId!);
  res.sendStatus(204);
});

app.use((error: Error, _req: Request, res: Response, _next: NextFunction) => { console.error("request failed", error.message); res.status(500).json({ error: "Unexpected server error" }); });

if (process.env.VITEST !== "true") {
  app.listen(config.PORT, () => console.log(`ClassPilot API listening on ${config.PORT}`));
  // Demo mode keeps the vertical slice usable without PostgreSQL/queue infrastructure.
  if (config.DEMO_MODE === "true") setInterval(() => void repository.claimJob().then(async (job) => {
    if (!job) return; await repository.finishJob(job.id, safeArtifact(job));
  }), 500);
}
export { app };
