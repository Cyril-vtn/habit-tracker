import * as z from "zod";
import { translations } from "@/lib/i18n/translations";
import { useLanguage } from "@/hooks/useLanguage";

type Language = keyof typeof translations;

export const createActivitySchema = (t: (key: string) => string) => {
  return z.object({
    activity_name: z.string().min(1, t("validation.nameRequired")),
    activity_type_id: z.string().min(1, t("validation.activityTypeRequired")),
    start_time: z.string().min(1, t("validation.startTimeRequired")),
    end_time: z.string().min(1, t("validation.endTimeRequired")),
    notes: z.string().optional(),
  });
};

export const createPlanSchema = (t: (key: string) => string) => {
  return z.object({
    plan_name: z.string().min(1, t("validation.planNameRequired")),
    start_time: z.string().min(1, t("validation.startTimeRequired")),
    end_time: z.string().min(1, t("validation.endTimeRequired")),
    notes: z.string().optional(),
  });
};

export type ActivityInput = z.infer<ReturnType<typeof createActivitySchema>>;
export type PlanInput = z.infer<ReturnType<typeof createPlanSchema>>;
