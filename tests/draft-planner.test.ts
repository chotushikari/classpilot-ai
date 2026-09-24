import { describe, expect, it } from "vitest";
import { buildDraftPlan } from "../src/assignment/draft-planner.js";

describe("buildDraftPlan", () => {
  it("creates source-traceable sections and deliverable checks", () => {
    const plan = buildDraftPlan({
      assignmentId: "cw-1",
      title: "Research brief",
      subject: "History",
      instructions: ["Use two primary sources."],
      rubricCriteria: ["Explain the historical context."],
      attachments: [{ sourceId: "rubric.pdf", kind: "application/pdf", summary: "Rubric" }],
      deliverables: [{ type: "pdf", filename: "research-brief.pdf", requirements: ["Include citations"] }],
      validationPlan: ["Check citation coverage"],
      unresolvedQuestions: ["Which citation style is required?"],
      submissionConstraints: [],
    });

    expect(plan.plannerVersion).toBe("draft-plan.v1");
    expect(plan.sections).toHaveLength(5);
    expect(plan.sections.find((section) => section.id === "requirements")?.sourceIds).toEqual(["rubric.pdf"]);
    expect(plan.checklist).toEqual(["Prepare PDF file: research-brief.pdf", "Validate: Check citation coverage"]);
    expect(plan.integrityNote).toContain("does not submit");
  });

  it("does not invent requirements or citations when the source is incomplete", () => {
    const plan = buildDraftPlan({
      assignmentId: "cw-2",
      title: "Open question",
      instructions: [],
      rubricCriteria: [],
      attachments: [],
      deliverables: [],
      validationPlan: [],
      unresolvedQuestions: [],
      submissionConstraints: [],
    });

    expect(plan.sections.find((section) => section.id === "requirements")?.prompt).toContain("Add the requirements");
    expect(plan.sections.find((section) => section.id === "evidence")?.prompt).toContain("Do not add unsupported citations");
  });
});
