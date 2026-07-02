import { z } from "zod";

export const disputeIntakeSchema = z.object({
  disputeDescription: z.string().trim().min(1, "Required"),
  disputePriority: z.string().trim().min(1, "Required"),
  disputeAcceptableOutcome: z.string().trim().min(1, "Required"),
});

export type DisputeIntakeInput = z.infer<typeof disputeIntakeSchema>;
