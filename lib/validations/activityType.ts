import * as z from "zod";
import { translations } from "@/lib/i18n/translations";

export const createActivityTypeSchema = (t: (key: string) => string) => {
  return z.object({
    name: z.string().min(1, t("validation.nameRequired")),
    color: z.string().min(1, t("validation.required")),
  });
};

// Pour la compatibilité avec le code existant
export const activityTypeSchema = createActivityTypeSchema(
  (key) =>
    translations.en.validation[
      key.split(".")[1] as keyof typeof translations.en.validation
    ] || key
);

export type ActivityTypeInput = z.infer<typeof activityTypeSchema>;
