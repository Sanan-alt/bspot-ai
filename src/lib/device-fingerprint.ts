/** Lightweight, privacy-preserving device signature used for abuse limiting. */
export function deviceFingerprint(): string {
  if (typeof window === "undefined") return "";
  const n = window.navigator;
  const s = window.screen;
  return [
    n.userAgent,
    n.language,
    (n as any).platform ?? "",
    (n as any).hardwareConcurrency ?? "",
    s ? `${s.width}x${s.height}x${s.colorDepth}` : "",
    new Date().getTimezoneOffset(),
  ].join("|");
}

/** Human-readable device label for security emails. */
export function deviceLabel(): string {
  if (typeof window === "undefined") return "Unknown device";
  const ua = window.navigator.userAgent;
  const browser =
    /Edg\//.test(ua) ? "Edge" :
    /OPR\//.test(ua) ? "Opera" :
    /Chrome\//.test(ua) ? "Chrome" :
    /Safari\//.test(ua) ? "Safari" :
    /Firefox\//.test(ua) ? "Firefox" : "Browser";
  const os =
    /Windows/.test(ua) ? "Windows" :
    /Android/.test(ua) ? "Android" :
    /iPhone|iPad/.test(ua) ? "iOS" :
    /Mac OS X/.test(ua) ? "macOS" :
    /Linux/.test(ua) ? "Linux" : "Unknown OS";
  return `${browser} on ${os}`;
}
