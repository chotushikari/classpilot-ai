import { createHash } from "node:crypto";
import type { AssignmentSource, ObservedAssignment, Snapshot, WatcherStore } from "./types.js";

const fingerprint = (item: ObservedAssignment) => createHash("sha256").update(JSON.stringify([item.title, item.state, item.updatedAt, item.dueAt])).digest("base64url");
const priority = (dueAt?: string) => {
  if (!dueAt) return 0;
  const hours = (Date.parse(dueAt) - Date.now()) / 3_600_000;
  return hours <= 24 ? 100 : hours <= 72 ? 50 : 10;
};
/** Durable watcher logic: writes a snapshot before enqueueing and uses a stable external idempotency key. */
export class AssignmentWatcher {
  constructor(private readonly source: AssignmentSource, private readonly store: WatcherStore) {}
  async scan(userId: string) {
    const observed = await this.source.listAssignments(userId); let created = 0; let updated = 0;
    for (const assignment of observed) {
      const next: Snapshot = { fingerprint: fingerprint(assignment), updatedAt: assignment.updatedAt };
      const previous = await this.store.getSnapshot(userId, assignment);
      if (previous?.fingerprint === next.fingerprint) continue;
      await this.store.saveSnapshot(userId, assignment, next);
      const externalId = `${assignment.courseId}:${assignment.courseworkId}:${next.fingerprint}`;
      await this.store.enqueue(userId, assignment, externalId, priority(assignment.dueAt));
      previous ? updated++ : created++;
    }
    return { seen: observed.length, created, updated };
  }
}
