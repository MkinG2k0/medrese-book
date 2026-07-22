import { z } from "zod";

export const updateStepCompletionSchema = z.object({
  grade: z.union([z.literal(3), z.literal(4), z.literal(5)]),
  note: z.string().optional().nullable(),
});

export const deleteStepCompletionsSchema = z.object({
  ids: z.array(z.string()).min(1),
  groupId: z.string().min(1).optional(),
});
