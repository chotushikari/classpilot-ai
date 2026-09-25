import type { Repository } from "../shared/types.js";
import type { AssignmentSource, ObservedAssignment, Snapshot, WatcherStore } from "./types.js";

/** Bridges watcher events to the existing idempotent job repository. */
export class RepositoryWatcherStore implements WatcherStore {
  private readonly snapshots = new Map<string, Snapshot>();
  constructor(private readonly repository: Pick<Repository, "createJob">) {}
  async getSnapshot(userId: string, assignment: ObservedAssignment) { return this.snapshots.get(this.key(userId, assignment)); }
  async saveSnapshot(userId: string, assignment: ObservedAssignment, snapshot: Snapshot) { this.snapshots.set(this.key(userId, assignment), snapshot); }
  async enqueue(userId: string, assignment: ObservedAssignment, idempotencyKey: string) {
    await this.repository.createJob({ userId, courseworkId: `${assignment.courseId}:${assignment.courseworkId}`, mode: "plan", context: { title: assignment.title, instructions: assignment.description, attachments: assignment.materials?.map((material) => ({ sourceId: material.id, kind: material.kind, extractedText: material.title })) }, idempotencyKey });
  }
  private key(userId: string, assignment: ObservedAssignment) { return `${userId}:${assignment.courseId}:${assignment.courseworkId}`; }
}

export function sourceFromAssignments(assignments: ObservedAssignment[]): AssignmentSource { return { async listAssignments() { return assignments; } }; }
