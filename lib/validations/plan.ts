import * as z from "zod";

export const planSchema = z.object({
  plan_name: z.string().min(1, "Plan name is required"),
  start_time: z.string(),
  end_time: z.string(),
  is_finished: z.boolean().optional().default(false),
});

export type PlanInput = z.infer<typeof planSchema>;
