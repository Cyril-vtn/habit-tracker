import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Language, translations } from "@/lib/i18n/translations";

type LanguageStore = {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: string) => string;
};

export const useLanguage = create<LanguageStore>()(
  persist(
    (set, get) => ({
      language: "en",
      setLanguage: (language: Language) => set({ language }),
      t: (key: string) => {
        const keys = key.split(".");
        let current: any = translations[get().language];
        for (const k of keys) {
          current = current?.[k];
        }
        return current || key;
      },
    }),
    {
      name: "language-storage",
    }
  )
);
