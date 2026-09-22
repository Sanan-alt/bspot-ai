import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { isDisposableDomain } from "./disposable-domains";

const EMAIL_RE = /^[^\s@]+@[^\s@]{1,255}\.[a-z]{2,}$/i;

async function sha256Hex(value: string): Promise<string> {
  const buf = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", buf);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function callerIp(): string | null {
  try {
    const h = getRequest()?.headers;
    if (!h) return null;
    return (
      h.get("cf-connecting-ip") ||
      h.get("x-real-ip") ||
      h.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      null
    );
  } catch {
    return null;
  }
}

/** Ask a public DNS resolver whether the domain can actually receive mail. */
async function domainAcceptsMail(domain: string): Promise<boolean> {
  const ask = async (type: "MX" | "A") => {
    try {
      const res = await fetch(
        `https://dns.google/resolve?name=${encodeURIComponent(domain)}&type=${type}`,
        { headers: { accept: "application/dns-json" } },
      );
      if (!res.ok) return null;
      const json = (await res.json()) as { Status?: number; Answer?: unknown[] };
      if (json.Status !== 0) return false;
      return Array.isArray(json.Answer) && json.Answer.length > 0;
    } catch {
      return null; // resolver unreachable — do not punish the user
    }
  };
  const mx = await ask("MX");
  if (mx === null) return true; // fail open when we cannot check
  if (mx) return true;
  const a = await ask("A");
  return a === null ? true : a;
}

export type SignupCheck = { ok: true } | { ok: false; code: string; message: string };

/**
 * Runs before an account is created: format, disposable-domain blocklist,
 * real-deliverability lookup and per-IP / per-device signup rate limiting.
 */
export const preSignupCheckFn = createServerFn({ method: "POST" })
  .inputValidator((input: { email: string; fingerprint?: string }) => ({
    email: String(input.email ?? "").trim().toLowerCase(),
    fingerprint: input.fingerprint ? String(input.fingerprint).slice(0, 128) : undefined,
  }))
  .handler(async ({ data }): Promise<SignupCheck> => {
    const { email, fingerprint } = data;

    if (!EMAIL_RE.test(email)) {
      return { ok: false, code: "format", message: "Please enter a valid email address." };
    }
    const domain = email.split("@")[1]!;

    if (isDisposableDomain(domain)) {
      return {
        ok: false,
        code: "disposable",
        message: "Temporary or disposable email addresses are not allowed. Please use a permanent address.",
      };
    }

    if (!(await domainAcceptsMail(domain))) {
      return {
        ok: false,
        code: "not_found",
        message: "Email not found — this address can't receive mail. Please check the spelling.",
      };
    }

    const ip = callerIp();
    const ipHash = ip ? await sha256Hex(ip) : null;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: limit } = await supabaseAdmin.rpc("check_signup_rate_limit", {
      p_ip_hash: ipHash,
      p_fingerprint: fingerprint ?? null,
    });
    const l = limit as { allowed?: boolean; reason?: string } | null;
    if (l && l.allowed === false) {
      return {
        ok: false,
        code: "rate_limited",
        message:
          l.reason === "device"
            ? "Too many accounts created from this device. Please try again in an hour."
            : "Too many accounts created from your network. Please try again in an hour.",
      };
    }

    return { ok: true };
  });

/** Records a completed signup so the rate limiter can see it. */
export const recordSignupAttemptFn = createServerFn({ method: "POST" })
  .inputValidator((input: { email: string; fingerprint?: string }) => ({
    email: String(input.email ?? "").trim().toLowerCase(),
    fingerprint: input.fingerprint ? String(input.fingerprint).slice(0, 128) : undefined,
  }))
  .handler(async ({ data }) => {
    const ip = callerIp();
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.rpc("record_signup_attempt", {
      p_ip_hash: ip ? await sha256Hex(ip) : null,
      p_email_hash: await sha256Hex(data.email),
      p_fingerprint: data.fingerprint ?? null,
    });
    return { ok: true };
  });

/**
 * Registers the current device for the signed-in user.
 * Returns isNewDevice=true the first time a device is seen, so the caller can
 * send a "new sign-in" alert email.
 */
export const registerDeviceFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { fingerprint: string }) => ({
    fingerprint: String(input.fingerprint ?? "").slice(0, 128),
  }))
  .handler(async ({ data, context }) => {
    if (!data.fingerprint) return { isNewDevice: false };
    const id = await sha256Hex(data.fingerprint);
    const { data: profile } = await context.supabase
      .from("profiles")
      .select("known_devices")
      .eq("id", context.userId)
      .maybeSingle();

    const known = (profile?.known_devices ?? []) as string[];
    if (known.includes(id)) return { isNewDevice: false };

    await context.supabase
      .from("profiles")
      .update({ known_devices: [...known, id].slice(-20) })
      .eq("id", context.userId);

    // First device ever recorded is the signup device — no alert needed.
    return { isNewDevice: known.length > 0 };
  });
