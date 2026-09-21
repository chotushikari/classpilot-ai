import { randomUUID } from "node:crypto";
import { config } from "./config.js";
import { PostgresRepository } from "./postgres-repository.js";
import type { Coursework, LearningArtifact, LearningJob, Repository, User } from "../shared/types.js";

/** In-memory adapter for local/demo use. Replace with the schema in db/schema.sql for deployments. */
export class MemoryRepository implements Repository {
  private users = new Map<string, User>();
  private bySubject = new Map<string, string>();
  private jobs = new Map<string, LearningJob>();
  private audits: Array<Record<string, string | undefined>> = [];

  async upsertUser(googleSubject: string, email?: string): Promise<User> {
    const found = this.bySubject.get(googleSubject);
    if (found) return this.users.get(found)!;
    const user = { id: randomUUID(), googleSubject, email };
    this.users.set(user.id, user); this.bySubject.set(googleSubject, user.id); return user;
  }
  async getUser(id: string) { return this.users.get(id); }
  async listCoursework(userId: string): Promise<Coursework[]> {
    return [{ id: "demo-coursework-1", userId, courseId: "demo-course", courseworkId: "1", title: "Welcome: plan your study session", dueAt: undefined, state: "PUBLISHED", updatedAt: new Date().toISOString() }];
  }
  async createJob(job: Omit<LearningJob, "id" | "state" | "attempts">): Promise<LearningJob> {
    const duplicate = [...this.jobs.values()].find((x) => x.userId === job.userId && x.idempotencyKey === job.idempotencyKey);
    if (duplicate) return duplicate;
    const created = { ...job, id: randomUUID(), state: "queued" as const, attempts: 0 };
    this.jobs.set(created.id, created); return created;
  }
  async getJob(userId: string, id: string) { const job = this.jobs.get(id); return job?.userId === userId ? job : undefined; }
  async claimJob() {
    const job = [...this.jobs.values()].find((item) => item.state === "queued");
    if (!job) return undefined;
    job.state = "running"; job.attempts += 1; return { ...job };
  }
  async finishJob(id: string, result: LearningArtifact) { const job = this.jobs.get(id); if (job) { job.state = "succeeded"; job.result = result; } }
  async failJob(id: string, code: string) { const job = this.jobs.get(id); if (job) { job.state = "failed"; job.errorCode = code; } }
  async audit(userId: string | undefined, action: string, target: string | undefined, outcome: string, correlationId: string) { this.audits.push({ userId, action, target, outcome, correlationId }); }
  async revokeConnection(_userId: string) { /* production adapter revokes vault token and database record */ }
  async storeGoogleConnection(_userId: string, _encryptedRefreshToken: string, _scopes: string[], _expiresAt?: string) { /* demo never retains real OAuth credentials */ }
}

export const repository: Repository = config.DEMO_MODE === "true" ? new MemoryRepository() : new PostgresRepository();
