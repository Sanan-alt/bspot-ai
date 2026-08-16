import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Bell, Check, CheckCheck, ChevronLeft, ChevronRight, Loader2, Search, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";
import { NotificationPreferences } from "@/components/NotificationPreferences";

export const Route = createFileRoute("/app/notifications")({ component: NotificationsPage });

type Notif = { id: string; title: string; message: string; type: string; read: boolean; created_at: string };
const TABS = ["all", "unread", "read", "system", "alert", "ai"] as const;
const PAGE_SIZE = 10;

function NotificationsPage() {
  const { user } = useAuth();
  const [items, setItems] = useState<Notif[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<(typeof TABS)[number]>("all");
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState<Notif | null>(null);

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
      .channel(`notif:${user.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` }, load)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
    // eslint-disable-next-line
  }, [user]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return items.filter((n) => {
      const byTab =
        tab === "all" ? true :
        tab === "unread" ? !n.read :
        tab === "read" ? n.read :
        n.type === tab;
      if (!byTab) return false;
      if (!needle) return true;
      return (n.title + " " + n.message).toLowerCase().includes(needle);
    });
  }, [items, tab, q]);

  useEffect(() => { setPage(1); }, [tab, q]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const paged = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const markRead = async (id: string) => {
    await supabase.from("notifications").update({ read: true }).eq("id", id);
    load();
  };
  const markUnread = async (id: string) => {
    await supabase.from("notifications").update({ read: false }).eq("id", id);
    load();
  };
  const markAllRead = async () => {
    if (!user) return;
    await supabase.from("notifications").update({ read: true }).eq("user_id", user.id).eq("read", false);
    toast.success("All notifications marked as read");
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

  const openDetails = (n: Notif) => {
    setOpen(n);
    if (!n.read) markRead(n.id);
  };

  const unread = items.filter((i) => !i.read).length;

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

      <div className="panel p-3 flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search notifications by keyword…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            aria-label="Search notifications"
          />
        </div>
        <div className="flex flex-wrap gap-1">
          {TABS.map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-3 h-8 rounded-md text-xs font-mono uppercase tracking-widest ${tab === t ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-neon"}`}>
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="panel p-0 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center"><Loader2 className="h-5 w-5 animate-spin mx-auto text-neon" /></div>
        ) : paged.length === 0 ? (
          <div className="p-12 text-center text-sm text-muted-foreground">
            <Bell className="h-8 w-8 mx-auto mb-2 opacity-40" />
            {q || tab !== "all" ? "No notifications match your filters." : "No notifications."}
          </div>
        ) : (
          <div className="divide-y divide-border">
            {paged.map((n) => (
              <div key={n.id} className={`p-4 flex items-start gap-3 ${!n.read ? "bg-accent/20" : ""}`}>
                <div className={`mt-1 h-2 w-2 rounded-full ${!n.read ? "bg-neon" : "bg-muted-foreground/30"}`} />
                <button onClick={() => openDetails(n)} className="flex-1 min-w-0 text-left">
                  <div className="flex items-center gap-2">
                    <span className="font-display text-sm">{n.title}</span>
                    <span className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground">{n.type}</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{n.message}</p>
                  <p className="font-mono text-[10px] text-muted-foreground mt-1">{new Date(n.created_at).toLocaleString()}</p>
                </button>
                <div className="flex gap-1">
                  {n.read ? (
                    <Button size="icon" variant="ghost" title="Mark as unread" onClick={() => markUnread(n.id)}><Bell className="h-4 w-4" /></Button>
                  ) : (
                    <Button size="icon" variant="ghost" title="Mark as read" onClick={() => markRead(n.id)}><Check className="h-4 w-4" /></Button>
                  )}
                  <Button size="icon" variant="ghost" title="Delete" onClick={() => remove(n.id)}><Trash2 className="h-4 w-4" /></Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {filtered.length > PAGE_SIZE && (
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span className="font-mono">
            {(safePage - 1) * PAGE_SIZE + 1}–{Math.min(safePage * PAGE_SIZE, filtered.length)} of {filtered.length}
          </span>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" disabled={safePage <= 1} onClick={() => setPage(safePage - 1)}>
              <ChevronLeft className="h-4 w-4" /> Prev
            </Button>
            <span className="font-mono">{safePage} / {pageCount}</span>
            <Button size="sm" variant="outline" disabled={safePage >= pageCount} onClick={() => setPage(safePage + 1)}>
              Next <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      <section className="panel p-5 space-y-4">
        <div>
          <h2 className="font-display text-lg">Notification preferences</h2>
          <p className="text-xs text-muted-foreground">Choose how you want to hear about each kind of update.</p>
        </div>
        <NotificationPreferences />
      </section>

      <Dialog open={!!open} onOpenChange={(o) => !o && setOpen(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{open?.title}</DialogTitle>
            <DialogDescription className="font-mono text-[10px] uppercase tracking-widest">
              {open?.type} · {open ? new Date(open.created_at).toLocaleString() : ""}
            </DialogDescription>
          </DialogHeader>
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">{open?.message}</p>
          {open && (
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => { markUnread(open.id); setOpen(null); }}>Mark unread</Button>
              <Button variant="outline" onClick={() => { remove(open.id); setOpen(null); }}>
                <Trash2 className="h-4 w-4" /> Delete
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
