import { z } from "zod";

export const updateStepCompletionSchema = z.object({
  grade: z.number().int().min(1).max(5),
  note: z.string().optional().nullable(),
});

export const deleteStepCompletionsSchema = z.object({
  ids: z.array(z.string()).min(1),
});
