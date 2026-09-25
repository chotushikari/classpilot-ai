import { describe, expect, it } from "vitest";
import { MemoryArtifactStore } from "../src/artifacts/store.js";

describe("artifact store", () => {
  it("keeps artifacts tenant- and job-scoped", async () => {
    const store = new MemoryArtifactStore();
    await store.put("user-a", "job-1", { filename: "draft.pdf", mimeType: "application/pdf", bytes: Buffer.from("pdf") });
    expect(await store.get("user-a", "job-1", "draft.pdf")).toBeDefined();
    expect(await store.get("user-b", "job-1", "draft.pdf")).toBeUndefined();
    expect(await store.get("user-a", "job-2", "draft.pdf")).toBeUndefined();
  });
});
