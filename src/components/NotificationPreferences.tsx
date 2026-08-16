import { useEffect, useState } from "react";
import { Switch } from "@/components/ui/switch";
import { Mail, Bell } from "lucide-react";
import {
  NOTIF_TYPES,
  NOTIF_TYPE_LABELS,
  getPref,
  setPref,
  type NotifType,
  type Channel,
} from "@/lib/notification-prefs";

/** Per-type email + in-app notification toggles (stored locally per device). */
export function NotificationPreferences() {
  const [prefs, setPrefs] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const next: Record<string, boolean> = {};
    for (const t of NOTIF_TYPES) {
      next[`${t}.email`] = getPref(t, "email");
      next[`${t}.inapp`] = getPref(t, "inapp");
    }
    setPrefs(next);
  }, []);

  const toggle = (t: NotifType, c: Channel, v: boolean) => {
    setPref(t, c, v);
    setPrefs((p) => ({ ...p, [`${t}.${c}`]: v }));
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-[1fr_auto_auto] items-center gap-x-6 gap-y-1">
        <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Type</span>
        <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground flex items-center gap-1">
          <Mail className="h-3 w-3" /> Email
        </span>
        <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground flex items-center gap-1">
          <Bell className="h-3 w-3" /> In-app
        </span>

        {NOTIF_TYPES.map((t) => (
          <div key={t} className="contents">
            <div className="py-2">
              <div className="text-sm">{NOTIF_TYPE_LABELS[t].label}</div>
              <div className="text-xs text-muted-foreground">{NOTIF_TYPE_LABELS[t].desc}</div>
            </div>
            <Switch
              aria-label={`${NOTIF_TYPE_LABELS[t].label} email notifications`}
              checked={prefs[`${t}.email`] ?? true}
              onCheckedChange={(v) => toggle(t, "email", v)}
            />
            <Switch
              aria-label={`${NOTIF_TYPE_LABELS[t].label} in-app notifications`}
              checked={prefs[`${t}.inapp`] ?? true}
              onCheckedChange={(v) => toggle(t, "inapp", v)}
            />
          </div>
        ))}
      </div>
      <p className="text-xs text-muted-foreground">
        Preferences apply to this device. In-app toggles control realtime pop-ups.
      </p>
    </div>
  );
}
