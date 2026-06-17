import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const IDLE_MS = 30 * 60 * 1000; // 30 minutes
const WARN_MS = 60 * 1000; // warn 1 min before
const EVENTS: (keyof WindowEventMap)[] = ["mousemove", "keydown", "click", "scroll", "touchstart"];

export function useIdleTimeout(enabled: boolean, onSignOut: () => void) {
  const lastActive = useRef(Date.now());
  const warned = useRef(false);

  useEffect(() => {
    if (!enabled) return;
    const reset = () => {
      lastActive.current = Date.now();
      warned.current = false;
    };
    EVENTS.forEach((e) => window.addEventListener(e, reset, { passive: true }));

    const interval = setInterval(async () => {
      const idle = Date.now() - lastActive.current;
      if (idle > IDLE_MS - WARN_MS && !warned.current && idle < IDLE_MS) {
        warned.current = true;
        toast.warning("You'll be signed out in 1 minute due to inactivity.");
      }
      if (idle >= IDLE_MS) {
        clearInterval(interval);
        await supabase.auth.signOut();
        toast.info("Signed out after 30 minutes of inactivity.");
        onSignOut();
      }
    }, 5000);

    return () => {
      EVENTS.forEach((e) => window.removeEventListener(e, reset));
      clearInterval(interval);
    };
  }, [enabled, onSignOut]);
}
