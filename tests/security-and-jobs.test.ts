import { randomUUID } from "node:crypto";
import { describe, expect, it } from "vitest";
import { jobRequestSchema, rejectMutation } from "../src/api/policy.js";
import { MemoryRepository } from "../src/api/repository.js";
import { TokenVault } from "../src/api/vault.js";
import { safeArtifact } from "../src/worker/processor.js";

describe("security boundaries", () => {
  it("encrypts refresh-token material without retaining plaintext", () => {
    const vault = new TokenVault(Buffer.alloc(32, 7));
    const cipher = vault.encrypt("refresh-token-value");
    expect(cipher).not.toContain("refresh-token-value");
    expect(vault.decrypt(cipher)).toBe("refresh-token-value");
  });
  it("blocks every mutation-shaped endpoint", () => {
    expect(rejectMutation("/v1/studentSubmissions/1:turnIn")).toBe(true);
    expect(rejectMutation("/v1/coursework")).toBe(false);
  });
  it("requires explicit consent and a UUID idempotency key", () => {
    const base = { mode: "plan", context: { title: "Study" }, idempotencyKey: randomUUID() };
    expect(jobRequestSchema.safeParse({ ...base, consent: false }).success).toBe(false);
    expect(jobRequestSchema.safeParse({ ...base, consent: true }).success).toBe(true);
  });
});

describe("learning job isolation", () => {
  it("is idempotent and cannot be read by a different user", async () => {
    const repo = new MemoryRepository(); const a = await repo.upsertUser("a"); const b = await repo.upsertUser("b"); const key = randomUUID();
    const payload = { userId: a.id, mode: "plan" as const, context: { title: "Study" }, idempotencyKey: key };
    const one = await repo.createJob(payload); const two = await repo.createJob(payload);
    expect(one.id).toBe(two.id); expect(await repo.getJob(b.id, one.id)).toBeUndefined();
  });
  it("returns learning scaffolding rather than a submission action", async () => {
    const repo = new MemoryRepository(); const user = await repo.upsertUser("student");
    const job = await repo.createJob({ userId: user.id, mode: "plan", context: { title: "Lab report" }, idempotencyKey: randomUUID() });
    expect((await safeArtifact(job)).integrityNote).toMatch(/does not submit/i);
  });
});
