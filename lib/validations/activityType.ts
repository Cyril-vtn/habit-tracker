import * as z from "zod";

export const activityTypeSchema = z.object({
  name: z
    .string()
    .min(1, "Activity type name is required")
    .max(50, "Activity type name must be less than 50 characters"),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, "Invalid color format")
    .default("#000000"),
});

export type ActivityTypeInput = z.infer<typeof activityTypeSchema>;
