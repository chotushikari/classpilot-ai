import { buildDraftPlan } from "../assignment/draft-planner.js";
import { intakeAssignment } from "../assignment/intake.js";
import { generateDocx, generatePdf } from "../artifacts/generators.js";
import { artifactStore } from "../artifacts/store.js";
import type { LearningArtifact, LearningJob } from "../shared/types.js";

/** Deliberately returns a structured study scaffold, never a completed assignment response. */
export async function safeArtifact(job: LearningJob): Promise<LearningArtifact> {
  const title = job.context.title.trim();
  const subject = job.context.instructions?.replace(/\s+/g, " ").slice(0, 500) || "Review the assignment instructions in Classroom.";
  const byMode = {
    clarify: [`Restate the goal of “${title}” in your own words.`, "Identify unfamiliar terms and ask your teacher or consult course materials.", "Write one small, verifiable next action."],
    plan: ["Estimate the time available before the due date.", "Break the work into research, draft, review, and submit-yourself checkpoints.", "Schedule a short check-in with your teacher if requirements are unclear."],
    quiz: ["What is the assignment asking you to demonstrate?", "Which class resource supports your first step?", "How will you check that your work follows the rubric?"],
    reflection: ["Name one concept you understand now.", "Name one question to ask before continuing.", "Record the next step you personally will take."]
  } as const;
  const specification = intakeAssignment({ assignmentId: job.courseworkId ?? job.id, title, description: job.context.instructions, attachments: job.context.attachments });
  const draftPlan = buildDraftPlan(specification);
  const [docx, pdf] = await Promise.all([generateDocx(draftPlan), generatePdf(draftPlan)]);
  await Promise.all([artifactStore.put(job.userId, job.id, docx), artifactStore.put(job.userId, job.id, pdf)]);
  return { summary: `Study support for “${title}”. ${subject}`, steps: [...byMode[job.mode]], questions: job.mode === "quiz" ? [...byMode.quiz] : ["What evidence will show your understanding?", "What is your next smallest step?"], citations: [], integrityNote: draftPlan.integrityNote, draftPlan, files: [docx, pdf].map((file) => ({ filename: file.filename, mimeType: file.mimeType, sizeBytes: file.bytes.byteLength, validation: "valid" as const })) };
}
