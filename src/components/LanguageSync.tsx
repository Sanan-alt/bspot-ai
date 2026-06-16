import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";

const I18N_LANGS = new Set(["en", "ur", "ar", "hi"]);

/**
 * Two-way sync between the user's profile.language and i18next.
 * - On login: load profile.language and switch i18n to it.
 * - On i18n change while logged in: persist back to profile.language.
 * Falls back silently to localStorage when no user is signed in.
 */
export function LanguageSync() {
  const { user } = useAuth();
  const { i18n } = useTranslation();
  const lastSyncedUser = useRef<string | null>(null);
  const remoteApplied = useRef<string | null>(null);

  // Restore on login & after refresh (runs whenever the user identity changes,
  // including the first resolved session after a hard reload).
  useEffect(() => {
    if (!user) {
      lastSyncedUser.current = null;
      remoteApplied.current = null;
      return;
    }
    if (lastSyncedUser.current === user.id) return;
    lastSyncedUser.current = user.id;
    (async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("language")
        .eq("id", user.id)
        .maybeSingle();
      if (error) {
        if (import.meta.env.DEV) console.warn("[LanguageSync] profile read failed", error.message);
        return;
      }
      const lang = data?.language;
      if (import.meta.env.DEV) {
        console.info("[LanguageSync] restored", { profile: lang, current: i18n.language });
      }
      if (lang && I18N_LANGS.has(lang) && lang !== i18n.language) {
        remoteApplied.current = lang;
        await i18n.changeLanguage(lang);
      } else if (!lang && I18N_LANGS.has(i18n.language)) {
        // Persist current UI language to profile so future devices restore correctly.
        void supabase.from("profiles").update({ language: i18n.language }).eq("id", user.id);
      }
    })();
  }, [user, i18n]);

  // Persist on change
  useEffect(() => {
    const onChange = (lng: string) => {
      if (!user) return;
      if (remoteApplied.current === lng) {
        remoteApplied.current = null;
        return;
      }
      if (!I18N_LANGS.has(lng)) return;
      void supabase.from("profiles").update({ language: lng }).eq("id", user.id);
    };
    i18n.on("languageChanged", onChange);
    return () => {
      i18n.off("languageChanged", onChange);
    };
  }, [i18n, user]);

  return null;
}
