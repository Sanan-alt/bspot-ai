import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

import en from "./locales/en.json";
import ur from "./locales/ur.json";
import ar from "./locales/ar.json";
import hi from "./locales/hi.json";
import fa from "./locales/fa.json";
import ru from "./locales/ru.json";
import fr from "./locales/fr.json";
import zh from "./locales/zh.json";
import ja from "./locales/ja.json";
import ko from "./locales/ko.json";
import it from "./locales/it.json";
import bn from "./locales/bn.json";
import { trackMissingKey } from "@/lib/telemetry";

const RTL = new Set(["ur", "ar", "fa", "he"]);

export const SUPPORTED_LANGS = ["en", "ur", "hi", "fa", "ar", "ru", "fr", "zh", "ja", "ko", "it", "bn"] as const;

void i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      ur: { translation: ur },
      ar: { translation: ar },
      hi: { translation: hi },
      fa: { translation: fa },
      ru: { translation: ru },
      fr: { translation: fr },
      zh: { translation: zh },
      ja: { translation: ja },
      ko: { translation: ko },
      it: { translation: it },
      bn: { translation: bn },
    },
    fallbackLng: "en",
    supportedLngs: SUPPORTED_LANGS as unknown as string[],
    parseMissingKeyHandler: (key) => key,
    saveMissing: true,
    missingKeyHandler: (lngs, _ns, key) => {
      for (const lng of lngs) trackMissingKey(lng, key);
    },
    interpolation: { escapeValue: false },
    detection: {
      order: ["localStorage", "navigator"],
      lookupLocalStorage: "bspot.lang",
      caches: ["localStorage"],
    },
  });

function applyDir(lng: string) {
  if (typeof document === "undefined") return;
  document.documentElement.dir = RTL.has(lng) ? "rtl" : "ltr";
  document.documentElement.lang = lng;
}

if (typeof document !== "undefined") {
  applyDir(i18n.language || "en");
  i18n.on("languageChanged", applyDir);
}

export default i18n;
