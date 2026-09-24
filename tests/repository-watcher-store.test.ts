import { describe, expect, it } from "vitest";
import { RepositoryWatcherStore, sourceFromAssignments } from "../src/watcher/repository-store.js";
import { MemoryRepository } from "../src/api/repository.js";
import { AssignmentWatcher } from "../src/watcher/assignment-watcher.js";

describe("RepositoryWatcherStore", () => {
  it("turns a new assignment into one idempotent learning job", async () => {
    const repository = new MemoryRepository(); const user = await repository.upsertUser("watcher-user");
    const assignment = { courseId: "course-1", courseworkId: "work-1", title: "Essay", description: "Use the rubric.", state: "PUBLISHED", updatedAt: "2026-09-24T00:00:00Z" };
    const watcher = new AssignmentWatcher(sourceFromAssignments([assignment]), new RepositoryWatcherStore(repository));
    expect(await watcher.scan(user.id)).toEqual({ seen: 1, created: 1, updated: 0 });
    expect(await watcher.scan(user.id)).toEqual({ seen: 1, created: 0, updated: 0 });
    const job = await repository.claimJob();
    expect(job?.context.title).toBe("Essay");
  });

  it("detects attachment-only changes through the fingerprint", async () => {
    const repository = new MemoryRepository(); const user = await repository.upsertUser("attachment-user");
    const store = new RepositoryWatcherStore(repository); const first = { courseId: "c", courseworkId: "w", title: "Lab", state: "PUBLISHED", updatedAt: "same", materials: [{ id: "rubric-v1", kind: "drive" }] };
    const second = { ...first, materials: [{ id: "rubric-v2", kind: "drive" }] };
    const watcher = new AssignmentWatcher(sourceFromAssignments([first]), store); await watcher.scan(user.id);
    const changed = new AssignmentWatcher(sourceFromAssignments([second]), store); expect(await changed.scan(user.id)).toEqual({ seen: 1, created: 0, updated: 1 });
  });
});
