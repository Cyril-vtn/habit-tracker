import { useLanguage } from "@/hooks/useLanguage";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface LanguageSelectorProps {
  className?: string;
}

export function LanguageSelector({ className }: LanguageSelectorProps) {
  const { t, language, setLanguage } = useLanguage();

  return (
    <div className={`space-y-2 ${className}`}>
      <label className="text-sm font-medium">{t("common.language")}</label>
      <Select
        value={language}
        onValueChange={(value: "en" | "zh") => setLanguage(value)}
      >
        <SelectTrigger>
          <SelectValue placeholder={t("common.selectLanguage")} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="en">English</SelectItem>
          <SelectItem value="zh">中文</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
