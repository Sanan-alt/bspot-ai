import { useEffect, useState } from "react";
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

// Display-only language picker. Persists choice in localStorage.
// Real i18n translations can be wired later; this exposes the UX the user wants.
type Lang = { code: string; label: string };

const GROUPS: { label: string; langs: Lang[] }[] = [
  {
    label: "Default",
    langs: [{ code: "en", label: "English" }],
  },
  {
    label: "Urdu & Pakistani languages",
    langs: [
      { code: "ur", label: "Urdu (اردو)" },
      { code: "pa", label: "Punjabi (پنجابی)" },
      { code: "sd", label: "Sindhi (سنڌي)" },
      { code: "bal", label: "Balochi (بلوچی)" },
      { code: "ps", label: "Pashto (پښتو)" },
      { code: "skr", label: "Saraiki (سرائیکی)" },
      { code: "brh", label: "Brahui" },
      { code: "khw", label: "Khowar / Chitrali" },
      { code: "bft", label: "Balti" },
      { code: "shi", label: "Shina" },
      { code: "ks", label: "Kashmiri (کٲشُر)" },
    ],
  },
  {
    label: "Indian languages",
    langs: [
      { code: "hi", label: "Hindi (हिन्दी)" },
      { code: "bn", label: "Bengali (বাংলা)" },
      { code: "te", label: "Telugu (తెలుగు)" },
      { code: "mr", label: "Marathi (मराठी)" },
      { code: "ta", label: "Tamil (தமிழ்)" },
      { code: "gu", label: "Gujarati (ગુજરાતી)" },
      { code: "kn", label: "Kannada (ಕನ್ನಡ)" },
      { code: "ml", label: "Malayalam (മലയാളം)" },
      { code: "or", label: "Odia (ଓଡ଼ିଆ)" },
      { code: "pa-in", label: "Punjabi – India (ਪੰਜਾਬੀ)" },
      { code: "as", label: "Assamese (অসমীয়া)" },
      { code: "ne", label: "Nepali (नेपाली)" },
      { code: "si", label: "Sinhala (සිංහල)" },
    ],
  },
  {
    label: "Middle East & Africa",
    langs: [
      { code: "ar", label: "Arabic (العربية)" },
      { code: "he", label: "Hebrew (עברית)" },
      { code: "fa", label: "Persian (فارسی)" },
      { code: "tr", label: "Turkish (Türkçe)" },
      { code: "sw", label: "Swahili (Kiswahili)" },
      { code: "ha", label: "Hausa" },
      { code: "yo", label: "Yoruba" },
      { code: "am", label: "Amharic (አማርኛ)" },
      { code: "af", label: "Afrikaans" },
      { code: "zu", label: "Zulu" },
    ],
  },
  {
    label: "Europe",
    langs: [
      { code: "fr", label: "French (Français)" },
      { code: "it", label: "Italian (Italiano)" },
      { code: "es", label: "Spanish (Español)" },
      { code: "pt", label: "Portuguese (Português)" },
      { code: "de", label: "German (Deutsch)" },
      { code: "nl", label: "Dutch (Nederlands)" },
      { code: "sv", label: "Swedish (Svenska)" },
      { code: "no", label: "Norwegian (Norsk)" },
      { code: "pl", label: "Polish (Polski)" },
      { code: "uk", label: "Ukrainian (Українська)" },
      { code: "ru", label: "Russian (Русский)" },
    ],
  },
  {
    label: "Asia Pacific",
    langs: [
      { code: "zh", label: "Chinese (中文)" },
      { code: "ja", label: "Japanese (日本語)" },
      { code: "ko", label: "Korean (한국어)" },
      { code: "id", label: "Indonesian (Bahasa Indonesia)" },
      { code: "th", label: "Thai (ไทย)" },
      { code: "vi", label: "Vietnamese (Tiếng Việt)" },
      { code: "ms", label: "Malay (Bahasa Melayu)" },
      { code: "tl", label: "Filipino (Tagalog)" },
    ],
  },
];

const STORAGE_KEY = "bspot.lang";

export function LanguageSelector({ compact = false }: { compact?: boolean }) {
  const [value, setValue] = useState<string>("en");

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setValue(saved);
    } catch {}
  }, []);

  const onChange = (v: string) => {
    setValue(v);
    try {
      localStorage.setItem(STORAGE_KEY, v);
    } catch {}
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
