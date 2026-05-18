import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Bell, Check, CheckCheck, Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";

export const Route = createFileRoute("/app/notifications")({ component: NotificationsPage });

type Notif = { id: string; title: string; message: string; type: string; read: boolean; created_at: string };
const TABS = ["all", "unread", "system", "alert", "ai"] as const;

function NotificationsPage() {
  const { user } = useAuth();
  const [items, setItems] = useState<Notif[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<typeof TABS[number]>("all");

  const load = async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("notifications").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    setItems((data ?? []) as Notif[]);
    setLoading(false);
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [user]);

  useEffect(() => {
    if (!user) return;
    const ch = supabase
      .channel(`notif-${user.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` }, load)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
    // eslint-disable-next-line
  }, [user]);

  const filtered = items.filter(n =>
    tab === "all" ? true :
    tab === "unread" ? !n.read :
    n.type === tab
  );

  const markRead = async (id: string) => {
    await supabase.from("notifications").update({ read: true }).eq("id", id);
    load();
  };
  const markAllRead = async () => {
    if (!user) return;
    await supabase.from("notifications").update({ read: true }).eq("user_id", user.id).eq("read", false);
    load();
  };
  const remove = async (id: string) => {
    await supabase.from("notifications").delete().eq("id", id);
    load();
  };
  const clearAll = async () => {
    if (!user) return;
    if (!confirm("Delete all notifications?")) return;
    await supabase.from("notifications").delete().eq("user_id", user.id);
    load();
  };

  const unread = items.filter(i => !i.read).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-muted-foreground">// NOTIFICATIONS</p>
          <h1 className="mt-2 font-display text-3xl md:text-4xl">Notification Center</h1>
          <p className="text-sm text-muted-foreground mt-1">{unread} unread · realtime updates</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={markAllRead} disabled={!unread}><CheckCheck className="h-4 w-4" /> Mark all read</Button>
          <Button variant="outline" onClick={clearAll} disabled={!items.length}><Trash2 className="h-4 w-4" /> Clear</Button>
        </div>
      </div>

      <div className="panel p-2 flex flex-wrap gap-1">
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-3 h-8 rounded-md text-xs font-mono uppercase tracking-widest ${tab === t ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-neon"}`}>
            {t}
          </button>
        ))}
      </div>

      <div className="panel p-0 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center"><Loader2 className="h-5 w-5 animate-spin mx-auto text-neon" /></div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-sm text-muted-foreground">
            <Bell className="h-8 w-8 mx-auto mb-2 opacity-40" />
            No notifications.
          </div>
        ) : (
          <div className="divide-y divide-border">
            {filtered.map(n => (
              <div key={n.id} className={`p-4 flex items-start gap-3 ${!n.read ? "bg-accent/20" : ""}`}>
                <div className={`mt-1 h-2 w-2 rounded-full ${!n.read ? "bg-neon" : "bg-muted-foreground/30"}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-display text-sm">{n.title}</span>
                    <span className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground">{n.type}</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{n.message}</p>
                  <p className="font-mono text-[10px] text-muted-foreground mt-1">{new Date(n.created_at).toLocaleString()}</p>
                </div>
                <div className="flex gap-1">
                  {!n.read && <Button size="icon" variant="ghost" onClick={() => markRead(n.id)}><Check className="h-4 w-4" /></Button>}
                  <Button size="icon" variant="ghost" onClick={() => remove(n.id)}><Trash2 className="h-4 w-4" /></Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
