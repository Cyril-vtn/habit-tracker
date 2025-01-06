import * as z from "zod";
import { translations } from "@/lib/i18n/translations";

export const createPlanSchema = (t: (key: string) => string) => {
  return z.object({
    plan_name: z.string().min(1, t("validation.planNameRequired")),
    start_time: z.string().min(1, t("validation.startTimeRequired")),
    end_time: z.string().min(1, t("validation.endTimeRequired")),
    is_finished: z.boolean().optional().default(false),
  });
};

export type PlanInput = z.infer<ReturnType<typeof createPlanSchema>>;
