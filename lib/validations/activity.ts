import { getMinutesFromTime } from "@/utils/timeUtils";
import * as z from "zod";

export const activitySchema = z
  .object({
    activity_name: z
      .string()
      .min(1, "Activity name is required")
      .max(100, "Activity name must be less than 100 characters"),
    start_time: z
      .string()
      .regex(/^(0?[1-9]|1[0-2]):[0-5][0-9] (AM|PM)$/, "Invalid time format"),
    end_time: z
      .string()
      .regex(/^(0?[1-9]|1[0-2]):[0-5][0-9] (AM|PM)$/, "Invalid time format"),
    activity_type_id: z.string().min(1, "Activity type is required"),
    notes: z
      .string()
      .max(1000, "Notes must be less than 1000 characters")
      .optional(),
  })
  .refine(
    (data) => {
      const startMinutes = getMinutesFromTime(data.start_time);
      const endMinutes = getMinutesFromTime(data.end_time);
      return endMinutes > startMinutes;
    },
    {
      message: "End time must be after start time",
      path: ["end_time"],
    }
  );

export type ActivityInput = z.infer<typeof activitySchema>;
