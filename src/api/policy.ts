import { z } from "zod";
import type { LearningMode } from "../shared/types.js";

const modes = ["clarify", "plan", "quiz", "reflection"] as const;
export const jobRequestSchema = z.object({
  courseworkId: z.string().max(120).optional(),
  mode: z.enum(modes),
  context: z.object({ title: z.string().min(1).max(200), instructions: z.string().max(4000).optional() }),
  consent: z.literal(true),
  idempotencyKey: z.string().uuid()
});

export function canCreateLearningJob(mode: LearningMode) { return modes.includes(mode); }
export function rejectMutation(path: string) {
  return /turnin|turn-in|attachment|grade|return|reclaim|coursework\/create/i.test(path);
}
