import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Globe } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Only languages that actually ship with full translations.
type Lang = { code: string; label: string };

const GROUPS: { label: string; langs: Lang[] }[] = [
  {
    label: "Default",
    langs: [{ code: "en", label: "English" }],
  },
  {
    label: "South Asia",
    langs: [
      { code: "ur", label: "Urdu (اردو)" },
      { code: "hi", label: "Hindi (हिन्दी)" },
      { code: "bn", label: "Bengali (বাংলা)" },
    ],
  },
  {
    label: "Middle East",
    langs: [
      { code: "ar", label: "Arabic (العربية)" },
      { code: "fa", label: "Persian (فارسی)" },
    ],
  },
  {
    label: "Europe",
    langs: [
      { code: "fr", label: "French (Français)" },
      { code: "it", label: "Italian (Italiano)" },
      { code: "ru", label: "Russian (Русский)" },
    ],
  },
  {
    label: "East Asia",
    langs: [
      { code: "zh", label: "Chinese (中文)" },
      { code: "ja", label: "Japanese (日本語)" },
      { code: "ko", label: "Korean (한국어)" },
    ],
  },
];

const STORAGE_KEY = "bspot.lang";

export function LanguageSelector({ compact = false }: { compact?: boolean }) {
  const { i18n } = useTranslation();
  const [value, setValue] = useState<string>(i18n.language || "en");

  useEffect(() => {
    setValue(i18n.language || "en");
  }, [i18n.language]);

  const onChange = (v: string) => {
    setValue(v);
    try {
      localStorage.setItem(STORAGE_KEY, v);
    } catch {}
    void i18n.changeLanguage(v);
  };

  return (
    <div className="flex items-center gap-2">
      <Globe className="h-4 w-4 text-neon" />
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className={compact ? "h-8 w-[140px] text-xs" : "h-9 w-[180px] text-xs"}>
          <SelectValue placeholder="Language" />
        </SelectTrigger>
        <SelectContent className="max-h-[360px]">
          {GROUPS.map((g) => (
            <SelectGroup key={g.label}>
              <SelectLabel className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                {g.label}
              </SelectLabel>
              {g.langs.map((l) => (
                <SelectItem key={l.code} value={l.code}>
                  {l.label}
                </SelectItem>
              ))}
            </SelectGroup>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
