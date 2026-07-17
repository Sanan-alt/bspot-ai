import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

import en from "./locales/en.json";
import ur from "./locales/ur.json";
import ar from "./locales/ar.json";
import hi from "./locales/hi.json";

const RTL = new Set(["ur", "ar", "fa", "he"]);

void i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      ur: { translation: ur },
      ar: { translation: ar },
      hi: { translation: hi },
    },
    fallbackLng: "en",
    supportedLngs: ["en", "ur", "ar", "hi"],
    // Fall back to English for any missing key, and log once in dev.
    parseMissingKeyHandler: (key) => {
      if (import.meta.env.DEV) {
        // eslint-disable-next-line no-console
        console.warn(`[i18n] missing translation for key "${key}" — using English fallback.`);
      }
      return key;
    },
    saveMissing: import.meta.env.DEV,
    missingKeyHandler: (lngs, _ns, key) => {
      if (import.meta.env.DEV) {
        // eslint-disable-next-line no-console
        console.warn(`[i18n] missing "${key}" in [${lngs.join(",")}] — falling back to en.`);
      }
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
