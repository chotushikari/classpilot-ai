import { Document, HeadingLevel, Packer, Paragraph, TextRun } from "docx";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import type { DraftPlan } from "../assignment/draft-planner.js";

export interface GeneratedFile {
  filename: string;
  mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" | "application/pdf";
  bytes: Buffer;
}

export function safeFilename(title: string, extension: "docx" | "pdf"): string {
  const normalized = title.normalize("NFKD").replace(/[^a-zA-Z0-9]+/g, "-").replace(/^-+|-+$/g, "").toLowerCase().slice(0, 90) || "classpilot-draft";
  return `${normalized}.${extension}`;
}

function checklistParagraphs(plan: DraftPlan): Paragraph[] {
  return plan.checklist.length ? plan.checklist.map((item) => new Paragraph({ text: `☐ ${item}` })) : [new Paragraph({ text: "☐ Confirm the required format and rubric in Classroom." })];
}

export async function generateDocx(plan: DraftPlan): Promise<GeneratedFile> {
  const children: Paragraph[] = [
    new Paragraph({ text: plan.title, heading: HeadingLevel.TITLE }),
    new Paragraph({ children: [new TextRun({ text: "ClassPilot reviewable draft packet", italics: true, color: "5C4BE5" })] }),
    new Paragraph({ text: plan.integrityNote }),
    new Paragraph({ text: "Requirements checklist", heading: HeadingLevel.HEADING_1 }),
    ...checklistParagraphs(plan),
  ];
  for (const section of plan.sections) {
    children.push(new Paragraph({ text: section.heading, heading: HeadingLevel.HEADING_1 }));
    children.push(new Paragraph({ text: section.prompt }));
    if (section.sourceIds.length) children.push(new Paragraph({ text: `Source references: ${section.sourceIds.join(", ")}` }));
  }
  if (plan.unresolvedQuestions.length) {
    children.push(new Paragraph({ text: "Questions to resolve", heading: HeadingLevel.HEADING_1 }));
    children.push(...plan.unresolvedQuestions.map((question) => new Paragraph({ text: `? ${question}` })));
  }
  const bytes = await Packer.toBuffer(new Document({ sections: [{ children }] }));
  return { filename: safeFilename(plan.title, "docx"), mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document", bytes: Buffer.from(bytes) };
}

function wrap(text: string, maxChars = 88): string[] {
  const words = text.split(/\s+/); const lines: string[] = []; let line = "";
  for (const word of words) { if ((line + " " + word).trim().length > maxChars && line) { lines.push(line); line = word; } else line = `${line} ${word}`.trim(); }
  if (line) lines.push(line); return lines;
}

export async function generatePdf(plan: DraftPlan): Promise<GeneratedFile> {
  const pdf = await PDFDocument.create(); const font = await pdf.embedFont(StandardFonts.Helvetica); const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  let page = pdf.addPage(); let y = page.getHeight() - 56;
  const write = (text: string, size = 11, strong = false, color = rgb(0.1, 0.13, 0.2)) => {
    for (const line of wrap(text)) { if (y < 56) { page = pdf.addPage(); y = page.getHeight() - 56; } page.drawText(line, { x: 48, y, size, font: strong ? bold : font, color }); y -= size + 7; }
    y -= 3;
  };
  write(plan.title, 22, true, rgb(0.36, 0.29, 0.9)); write("ClassPilot reviewable draft packet", 11, false, rgb(0.35, 0.38, 0.48)); write(plan.integrityNote, 10);
  write("Requirements checklist", 15, true); (plan.checklist.length ? plan.checklist : ["Confirm the required format and rubric in Classroom."]).forEach((item) => write(`[ ] ${item}`, 10));
  for (const section of plan.sections) { write(section.heading, 15, true); write(section.prompt, 10); if (section.sourceIds.length) write(`Source references: ${section.sourceIds.join(", ")}`, 9, false, rgb(0.35, 0.38, 0.48)); }
  if (plan.unresolvedQuestions.length) { write("Questions to resolve", 15, true); plan.unresolvedQuestions.forEach((question) => write(`? ${question}`, 10)); }
  const bytes = Buffer.from(await pdf.save());
  return { filename: safeFilename(plan.title, "pdf"), mimeType: "application/pdf", bytes };
}
