export const NOTIF_TYPES = ["system", "alert", "ai"] as const;
export type NotifType = (typeof NOTIF_TYPES)[number];

export const NOTIF_TYPE_LABELS: Record<NotifType, { label: string; desc: string }> = {
  system: { label: "System", desc: "Account, billing and product updates" },
  alert: { label: "Market alerts", desc: "Watchlist and price movement alerts" },
  ai: { label: "AI insights", desc: "Assistant tips and generated insights" },
};

export type Channel = "email" | "inapp";

const key = (type: NotifType, channel: Channel) => `bspot.notif.${channel}.${type}`;

export function getPref(type: NotifType, channel: Channel): boolean {
  if (typeof window === "undefined") return true;
  return localStorage.getItem(key(type, channel)) !== "0";
}

export function setPref(type: NotifType, channel: Channel, value: boolean) {
  if (typeof window === "undefined") return;
  localStorage.setItem(key(type, channel), value ? "1" : "0");
  window.dispatchEvent(new CustomEvent("bspot:notif-prefs"));
}

/** In-app toast allowed for a notification type (unknown types default to on). */
export function isInAppEnabled(type: string): boolean {
  if (!(NOTIF_TYPES as readonly string[]).includes(type)) return true;
  return getPref(type as NotifType, "inapp");
}
