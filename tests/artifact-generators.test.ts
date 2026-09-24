import { describe, expect, it } from "vitest";
import { generateDocx, generatePdf, safeFilename } from "../src/artifacts/generators.js";
import { PDFDocument } from "pdf-lib";
import type { DraftPlan } from "../src/assignment/draft-planner.js";

const plan: DraftPlan = {
  title: "A Very Useful Research / Draft",
  subject: "History",
  sections: [{ id: "overview", kind: "overview", heading: "Overview", prompt: "Explain the goal in your own words.", sourceIds: ["rubric.pdf"], studentAuthored: true }],
  checklist: ["Prepare PDF file: research.pdf"],
  unresolvedQuestions: ["Which citation style is required?"],
  integrityNote: "Review and complete this draft yourself.",
  plannerVersion: "draft-plan.v1",
};

describe("artifact generators", () => {
  it("creates safe predictable filenames", () => expect(safeFilename("A Very Useful Research / Draft", "pdf")).toBe("a-very-useful-research-draft.pdf"));
  it("creates a reopenable DOCX payload", async () => { const file = await generateDocx(plan); expect(file.filename).toBe("a-very-useful-research-draft.docx"); expect(file.bytes.subarray(0, 2).toString()).toBe("PK"); expect(file.bytes.length).toBeGreaterThan(1000); });
  it("creates a valid PDF payload", async () => { const file = await generatePdf(plan); expect(file.filename).toBe("a-very-useful-research-draft.pdf"); expect(file.bytes.subarray(0, 5).toString()).toBe("%PDF-"); const document = await PDFDocument.load(file.bytes); expect(document.getPageCount()).toBeGreaterThan(0); });
});
