// Locale-aware formatting helpers. Falls back to "en" when the runtime
// doesn't support the requested locale.
import i18n from "@/i18n";

const LOCALE_MAP: Record<string, string> = {
  en: "en-US",
  ur: "ur-PK",
  ar: "ar-SA",
  hi: "hi-IN",
};

function currentLocale(): string {
  const lng = (i18n.language || "en").split("-")[0];
  return LOCALE_MAP[lng] ?? "en-US";
}

export function formatCurrency(
  value: number,
  currency = "USD",
  options: Intl.NumberFormatOptions = {},
): string {
  try {
    return new Intl.NumberFormat(currentLocale(), {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
      ...options,
    }).format(value);
  } catch {
    return `${currency} ${value.toFixed(2)}`;
  }
}

export function formatNumber(value: number, options: Intl.NumberFormatOptions = {}): string {
  try {
    return new Intl.NumberFormat(currentLocale(), options).format(value);
  } catch {
    return String(value);
  }
}

export function formatPercent(value: number, fractionDigits = 2): string {
  try {
    return new Intl.NumberFormat(currentLocale(), {
      style: "percent",
      minimumFractionDigits: fractionDigits,
      maximumFractionDigits: fractionDigits,
    }).format(value / 100);
  } catch {
    return `${value.toFixed(fractionDigits)}%`;
  }
}

export function formatDate(
  value: string | number | Date,
  options: Intl.DateTimeFormatOptions = { dateStyle: "medium" },
): string {
  try {
    return new Intl.DateTimeFormat(currentLocale(), options).format(new Date(value));
  } catch {
    return new Date(value).toLocaleDateString();
  }
}

export function formatDateTime(value: string | number | Date): string {
  return formatDate(value, { dateStyle: "medium", timeStyle: "short" });
}
