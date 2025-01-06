import * as z from "zod";

export const activitySchema = z.object({
  activity_name: z.string().min(1, "Name is required"),
  activity_type_id: z.string().min(1, "Activity type is required"),
  start_time: z.string().min(1, "Start time is required"),
  end_time: z.string().min(1, "End time is required"),
  notes: z.string().optional(),
});

export type ActivityInput = z.infer<typeof activitySchema>;

export const planSchema = z.object({
  plan_name: z.string().min(1, "Name is required"),
  start_time: z.string().min(1, "Start time is required"),
  end_time: z.string().min(1, "End time is required"),
  notes: z.string().optional(),
});

export type PlanInput = z.infer<typeof planSchema>;
