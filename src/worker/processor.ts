import { buildDraftPlan } from "../assignment/draft-planner.js";
import type { LearningArtifact, LearningJob } from "../shared/types.js";

/** Deliberately returns a structured study scaffold, never a completed assignment response. */
export function safeArtifact(job: LearningJob): LearningArtifact {
  const title = job.context.title.trim();
  const subject = job.context.instructions?.replace(/\s+/g, " ").slice(0, 500) || "Review the assignment instructions in Classroom.";
  const byMode = {
    clarify: [`Restate the goal of “${title}” in your own words.`, "Identify unfamiliar terms and ask your teacher or consult course materials.", "Write one small, verifiable next action."],
    plan: ["Estimate the time available before the due date.", "Break the work into research, draft, review, and submit-yourself checkpoints.", "Schedule a short check-in with your teacher if requirements are unclear."],
    quiz: ["What is the assignment asking you to demonstrate?", "Which class resource supports your first step?", "How will you check that your work follows the rubric?"],
    reflection: ["Name one concept you understand now.", "Name one question to ask before continuing.", "Record the next step you personally will take."]
  } as const;
  const draftPlan = buildDraftPlan({
    assignmentId: job.courseworkId ?? job.id,
    title,
    instructions: job.context.instructions ? [job.context.instructions] : [],
    rubricCriteria: [],
    attachments: [],
    deliverables: [],
    validationPlan: [],
    unresolvedQuestions: ["Confirm the required format, rubric, and due date in Classroom."],
    submissionConstraints: [],
  });
  return { summary: `Study support for “${title}”. ${subject}`, steps: [...byMode[job.mode]], questions: job.mode === "quiz" ? [...byMode.quiz] : ["What evidence will show your understanding?", "What is your next smallest step?"], citations: [], integrityNote: draftPlan.integrityNote, draftPlan };
}
