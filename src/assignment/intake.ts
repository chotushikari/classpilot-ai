import { assignmentSpecificationSchema, type AssignmentSpecification } from "./specification.js";

export interface IntakeInput { assignmentId: string; title: string; description?: string; attachments?: Array<{ sourceId: string; kind: string; extractedText?: string }>; }
const suspicious = /ignore (all |previous |prior )?instructions|system prompt|developer message|tool call|execute this/i;
const classify = (text: string) => /\.pdf\b|pdf/i.test(text) ? "pdf" : /\.docx\b|word document/i.test(text) ? "docx" : /\.pptx\b|presentation/i.test(text) ? "pptx" : /\.xlsx\b|spreadsheet/i.test(text) ? "xlsx" : "unknown";
/** Deterministic baseline; later structured-model extraction must validate against this exact schema. */
export function intakeAssignment(input: IntakeInput): AssignmentSpecification {
  const description = input.description?.trim() || "";
  const safeAttachments = (input.attachments ?? []).map((attachment) => ({ sourceId: attachment.sourceId, kind: attachment.kind, summary: suspicious.test(attachment.extractedText ?? "") ? "Attachment content requires review: it contains instruction-like text." : (attachment.extractedText ?? "").slice(0, 4000) }));
  const requirementSentences = description.split(/\n|(?<=[.!?])\s+/).map((item) => item.trim()).filter(Boolean).slice(0, 50);
  const inferred = classify(`${input.title} ${description}`);
  const spec = { assignmentId: input.assignmentId, title: input.title.trim(), instructions: requirementSentences, rubricCriteria: [], attachments: safeAttachments, deliverables: inferred === "unknown" ? [] : [{ type: inferred, filename: `${input.title.trim().replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "").slice(0, 80) || "assignment"}.${inferred}`, requirements: requirementSentences.slice(0, 5) }], validationPlan: ["Confirm all stated requirements are represented before any artifact is generated."], unresolvedQuestions: inferred === "unknown" ? ["Required output format is not explicit."] : [], submissionConstraints: ["No Classroom write or turn-in action is authorized by intake." ] };
  return assignmentSpecificationSchema.parse(spec);
}
