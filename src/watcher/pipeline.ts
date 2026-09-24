import { safeArtifact } from "../worker/processor.js";
import type { Repository } from "../shared/types.js";
import { AssignmentWatcher } from "./assignment-watcher.js";
import { RepositoryWatcherStore } from "./repository-store.js";
import type { AssignmentSource } from "./types.js";

/** One complete, read-only pass from detected coursework to validated file metadata. */
export class AssignmentPipeline {
  private readonly watcher: AssignmentWatcher;
  constructor(private readonly repository: Repository, source: AssignmentSource) { this.watcher = new AssignmentWatcher(source, new RepositoryWatcherStore(repository)); }
  async runOnce(userId: string) {
    const scan = await this.watcher.scan(userId); let processed = 0;
    for (;;) {
      const job = await this.repository.claimJob(); if (!job) break;
      try { await this.repository.finishJob(job.id, await safeArtifact(job)); processed++; } catch (error) { await this.repository.failJob(job.id, "artifact_generation_failed"); throw error; }
    }
    return { scan, processed };
  }
}
