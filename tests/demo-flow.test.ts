import { describe, expect, it } from "vitest";
import { MemoryRepository } from "../src/api/repository.js";
import { AssignmentPipeline } from "../src/watcher/pipeline.js";
import { sourceFromAssignments } from "../src/watcher/repository-store.js";

describe("local end-to-end assignment flow", () => {
  it("detects, structures, generates, and validates a student-review packet", async () => {
    const repository = new MemoryRepository(); const user = await repository.upsertUser("demo-flow");
    const pipeline = new AssignmentPipeline(repository, sourceFromAssignments([{ courseId: "science", courseworkId: "lab-1", title: "Water quality lab", description: "Write a report and submit a PDF. Use the attached rubric.", state: "PUBLISHED", updatedAt: "2026-09-25T00:00:00Z", materials: [{ id: "rubric-1", kind: "drive", title: "rubric.pdf" }] }]));
    await expect(pipeline.runOnce(user.id)).resolves.toMatchObject({ scan: { created: 1 }, processed: 1 });
    const [job] = await repository.listJobs(user.id);
    expect(job?.state).toBe("succeeded"); expect(job?.result?.draftPlan?.plannerVersion).toBe("draft-plan.v1");
    expect(job?.result?.files?.map((file) => file.mimeType)).toEqual(["application/vnd.openxmlformats-officedocument.wordprocessingml.document", "application/pdf"]);
    expect(job?.result?.integrityNote).toMatch(/does not submit/i);
  });
});
