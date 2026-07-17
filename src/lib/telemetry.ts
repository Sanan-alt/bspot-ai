// Batched, production-safe telemetry writer.
// Queues events client-side, flushes every FLUSH_MS or on visibility change.
// Never spams the console in prod; dev logs a compact summary only.
import { supabase } from "@/integrations/supabase/client";

type EventLevel = "info" | "warn" | "error";
export type TelemetryEvent = {
  event: string;
  path?: string;
  value?: number;
  level?: EventLevel;
  metadata?: Record<string, unknown>;
};

const FLUSH_MS = 5000;
const MAX_BATCH = 25;
let queue: TelemetryEvent[] = [];
let missingKeys = new Map<string, { lang: string; key: string; count: number; path?: string }>();
let sessionId: string | null = null;
let userId: string | null = null;
let timer: ReturnType<typeof setTimeout> | null = null;
let started = false;

function getSessionId(): string {
  if (sessionId) return sessionId;
  if (typeof window === "undefined") return "ssr";
  try {
    const stored = sessionStorage.getItem("bspot.sid");
    if (stored) { sessionId = stored; return stored; }
    const fresh = crypto.randomUUID();
    sessionStorage.setItem("bspot.sid", fresh);
    sessionId = fresh;
    return fresh;
  } catch { sessionId = "anon"; return "anon"; }
}

async function resolveUserId() {
  if (typeof window === "undefined") return;
  try {
    const { data } = await supabase.auth.getUser();
    userId = data.user?.id ?? null;
  } catch { /* silent */ }
}

function scheduleFlush() {
  if (timer) return;
  timer = setTimeout(() => { timer = null; void flush(); }, FLUSH_MS);
}

export async function flush() {
  if (typeof window === "undefined") return;
  const events = queue.splice(0, queue.length);
  const missing = Array.from(missingKeys.values());
  missingKeys = new Map();
  if (events.length === 0 && missing.length === 0) return;

  const sid = getSessionId();
  try {
    if (events.length) {
      await supabase.from("telemetry_events").insert(
        events.map(e => ({
          event: e.event,
          path: e.path ?? (typeof location !== "undefined" ? location.pathname : null),
          value: e.value ?? null,
          level: e.level ?? "info",
          metadata: (e.metadata ?? null) as never,
          session_id: sid,
          user_id: userId,
        }))
      );
    }
    if (missing.length) {
      await supabase.from("i18n_missing_keys").insert(missing);
    }
  } catch {
    // Silent in prod — never log user-facing noise.
    if (import.meta.env.DEV) console.debug("[telemetry] flush failed");
  }
}

export function track(event: string, opts: Omit<TelemetryEvent, "event"> = {}) {
  queue.push({ event, ...opts });
  if (queue.length >= MAX_BATCH) void flush();
  else scheduleFlush();
}

export function trackMissingKey(lang: string, key: string) {
  const k = `${lang}::${key}`;
  const existing = missingKeys.get(k);
  if (existing) existing.count += 1;
  else missingKeys.set(k, {
    lang, key, count: 1,
    path: typeof location !== "undefined" ? location.pathname : undefined,
  });
  scheduleFlush();
}

export function startTelemetry() {
  if (started || typeof window === "undefined") return;
  started = true;
  void resolveUserId();
  supabase.auth.onAuthStateChange((_e, sess) => { userId = sess?.user?.id ?? null; });

  window.addEventListener("error", (e) => {
    track("client_error", {
      level: "error",
      metadata: { message: e.message?.slice(0, 500), source: e.filename, line: e.lineno, col: e.colno },
    });
  });
  window.addEventListener("unhandledrejection", (e) => {
    const reason = e.reason instanceof Error ? e.reason.message : String(e.reason ?? "").slice(0, 500);
    track("unhandled_rejection", { level: "error", metadata: { reason } });
  });

  // Flush best-effort on tab hide/close.
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") void flush();
  });
  window.addEventListener("pagehide", () => { void flush(); });
}
