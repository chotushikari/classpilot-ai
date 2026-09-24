import { repository } from "../api/repository.js";
import { safeArtifact } from "./processor.js";

async function poll() {
  const job = await repository.claimJob();
  if (!job) return;
  try { await repository.finishJob(job.id, await safeArtifact(job)); await repository.audit(job.userId, "learning_job.complete", job.id, "success", job.id); }
  catch { await repository.failJob(job.id, "PROCESSING_ERROR"); }
}

console.log("ClassPilot worker started (read-only learning job processor)");
setInterval(() => { void poll(); }, 800);
