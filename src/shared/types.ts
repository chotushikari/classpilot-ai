export type LearningMode = "clarify" | "plan" | "quiz" | "reflection";
export type JobState = "queued" | "running" | "succeeded" | "failed";

export interface User { id: string; googleSubject: string; email?: string; }
export interface Coursework {
  id: string; userId: string; courseId: string; courseworkId: string;
  title: string; dueAt?: string; state: string; updatedAt: string;
}
export interface LearningArtifact {
  summary: string; steps: string[]; questions: string[];
  integrityNote: string; citations: string[];
}
export interface LearningJob {
  id: string; userId: string; courseworkId?: string; mode: LearningMode;
  context: { title: string; instructions?: string }; state: JobState;
  attempts: number; idempotencyKey: string; result?: LearningArtifact; errorCode?: string;
}

export interface Repository {
  upsertUser(subject: string, email?: string): Promise<User>;
  getUser(id: string): Promise<User | undefined>;
  listCoursework(userId: string): Promise<Coursework[]>;
  createJob(job: Omit<LearningJob, "id" | "state" | "attempts">): Promise<LearningJob>;
  getJob(userId: string, id: string): Promise<LearningJob | undefined>;
  claimJob(): Promise<LearningJob | undefined>;
  finishJob(id: string, result: LearningArtifact): Promise<void>;
  failJob(id: string, code: string): Promise<void>;
  audit(userId: string | undefined, action: string, target: string | undefined, outcome: string, correlationId: string): Promise<void>;
  revokeConnection(userId: string): Promise<void>;
  storeGoogleConnection(userId: string, encryptedRefreshToken: string, scopes: string[], expiresAt?: string): Promise<void>;
  requestDeletion(userId: string): Promise<void>;
  upsertCoursework(items: Coursework[]): Promise<void>;
  getGoogleConnection(userId: string): Promise<{ encryptedRefreshToken: string } | undefined>;
}
