import { useEffect, useRef } from "react";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

/**
 * Mounted once inside the app shell: shows a toast whenever a new
 * notification row arrives in realtime for the signed-in user.
 */
export function NotificationsListener() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const seen = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!user) return;
    const ch = supabase
      .channel(`notif-toast:${user.id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` },
        (payload) => {
          const n = payload.new as { id: string; title: string; message: string };
          if (!n?.id || seen.current.has(n.id)) return;
          seen.current.add(n.id);
          toast(n.title, {
            description: n.message,
            action: {
              label: "View",
              onClick: () => navigate({ to: "/app/notifications" }),
            },
          });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(ch);
    };
  }, [user?.id, navigate]);

  return null;
}
