import { describe, expect, it } from "vitest";
import { MemoryRepository } from "../src/api/repository.js";
import { AssignmentPipeline } from "../src/watcher/pipeline.js";
import { sourceFromAssignments } from "../src/watcher/repository-store.js";

describe("AssignmentPipeline", () => {
  it("processes a new assignment into validated DOCX/PDF metadata", async () => {
    const repository = new MemoryRepository(); const user = await repository.upsertUser("pipeline-user");
    const pipeline = new AssignmentPipeline(repository, sourceFromAssignments([{ courseId: "c", courseworkId: "w", title: "Lab report", description: "Explain the method.", state: "PUBLISHED", updatedAt: "now" }]));
    expect(await pipeline.runOnce(user.id)).toMatchObject({ scan: { created: 1 }, processed: 1 });
    const job = await repository.claimJob(); expect(job).toBeUndefined();
    const stored = await repository.getJob(user.id, "missing"); expect(stored).toBeUndefined();
  });
});
