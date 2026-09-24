import type { AssignmentSpecification } from "./specification.js";

export type DraftSectionKind = "overview" | "requirements" | "outline" | "evidence" | "review";

export interface DraftSection {
  id: string;
  kind: DraftSectionKind;
  heading: string;
  prompt: string;
  sourceIds: string[];
  studentAuthored: boolean;
}

export interface DraftPlan {
  title: string;
  subject?: string;
  sections: DraftSection[];
  checklist: string[];
  unresolvedQuestions: string[];
  integrityNote: string;
  plannerVersion: string;
}

const INTEGRITY_NOTE = "Review, verify, and complete this draft yourself. ClassPilot does not submit, grade, or claim that generated content is correct.";

/**
 * Builds a deterministic, source-traceable draft scaffold. This is intentionally
 * not an answer generator: every content-bearing section is a student-authored
 * prompt or a requirement copied from the validated assignment specification.
 */
export function buildDraftPlan(specification: AssignmentSpecification): DraftPlan {
  const sourceIds = specification.attachments.map((attachment) => attachment.sourceId);
  const requirements = [...specification.instructions, ...specification.rubricCriteria];
  const sections: DraftSection[] = [
    {
      id: "overview",
      kind: "overview",
      heading: "Assignment overview",
      prompt: `Explain the goal of “${specification.title}” in your own words before drafting.`,
      sourceIds,
      studentAuthored: true,
    },
    {
      id: "requirements",
      kind: "requirements",
      heading: "Requirements to satisfy",
      prompt: requirements.length ? requirements.join("\n") : "Add the requirements you confirmed from Classroom.",
      sourceIds,
      studentAuthored: false,
    },
    {
      id: "outline",
      kind: "outline",
      heading: "Your working outline",
      prompt: "Add the sections, arguments, calculations, or steps you plan to complete.",
      sourceIds: [],
      studentAuthored: true,
    },
    {
      id: "evidence",
      kind: "evidence",
      heading: "Evidence and sources",
      prompt: "Record source IDs, quotations, calculations, or class resources you personally verified. Do not add unsupported citations.",
      sourceIds,
      studentAuthored: true,
    },
    {
      id: "review",
      kind: "review",
      heading: "Final review",
      prompt: "Check the rubric, formatting, citations, calculations, and your own understanding before submission.",
      sourceIds: [],
      studentAuthored: true,
    },
  ];

  const deliverableChecklist = specification.deliverables.map((deliverable) => `Prepare ${deliverable.type.toUpperCase()} file: ${deliverable.filename}`);
  const validationChecklist = specification.validationPlan.map((item) => `Validate: ${item}`);

  return {
    title: specification.title,
    subject: specification.subject,
    sections,
    checklist: [...deliverableChecklist, ...validationChecklist],
    unresolvedQuestions: [...specification.unresolvedQuestions],
    integrityNote: INTEGRITY_NOTE,
    plannerVersion: "draft-plan.v1",
  };
}
