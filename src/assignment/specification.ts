import { z } from "zod";

export const deliverableSchema = z.object({ type: z.enum(["docx", "pdf", "pptx", "xlsx", "code", "zip", "unknown"]), filename: z.string().min(1).max(180), requirements: z.array(z.string().min(1).max(500)).max(30) });
export const assignmentSpecificationSchema = z.object({ assignmentId: z.string().min(1), title: z.string().min(1).max(3000), subject: z.string().max(120).optional(), instructions: z.array(z.string().min(1).max(30000)).max(50), rubricCriteria: z.array(z.string().min(1).max(2000)).max(50), attachments: z.array(z.object({ sourceId: z.string(), kind: z.string(), summary: z.string().max(4000) })).max(20), deliverables: z.array(deliverableSchema).max(10), validationPlan: z.array(z.string().min(1).max(500)).max(30), unresolvedQuestions: z.array(z.string().min(1).max(1000)).max(20), submissionConstraints: z.array(z.string().min(1).max(1000)).max(20) });
export type AssignmentSpecification = z.infer<typeof assignmentSpecificationSchema>;
