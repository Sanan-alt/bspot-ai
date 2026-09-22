/**
 * Blocklist of throwaway / disposable email providers.
 * Signups from these domains are rejected before the account is created.
 */
export const DISPOSABLE_DOMAINS = new Set<string>([
  "mailinator.com",
  "guerrillamail.com",
  "guerrillamail.net",
  "guerrillamail.org",
  "guerrillamail.biz",
  "guerrillamailblock.com",
  "sharklasers.com",
  "grr.la",
  "spam4.me",
  "10minutemail.com",
  "10minutemail.net",
  "20minutemail.com",
  "tempmail.com",
  "temp-mail.org",
  "temp-mail.io",
  "tempmailo.com",
  "tempr.email",
  "throwawaymail.com",
  "trashmail.com",
  "trashmail.de",
  "getnada.com",
  "nada.email",
  "dispostable.com",
  "yopmail.com",
  "yopmail.fr",
  "yopmail.net",
  "maildrop.cc",
  "mailnesia.com",
  "mailcatch.com",
  "moakt.com",
  "fakeinbox.com",
  "fakemailgenerator.com",
  "emailondeck.com",
  "mohmal.com",
  "inboxkitten.com",
  "burnermail.io",
  "mytemp.email",
  "email-temp.com",
  "luxusmail.org",
  "mail-temp.com",
  "discard.email",
  "spambog.com",
  "spamgourmet.com",
  "mintemail.com",
  "tempinbox.com",
  "vomoto.com",
  "mailpoof.com",
  "harakirimail.com",
  "cock.li",
  "byom.de",
]);

export function isDisposableDomain(domain: string): boolean {
  const d = domain.trim().toLowerCase();
  if (DISPOSABLE_DOMAINS.has(d)) return true;
  // catch obvious subdomains e.g. foo.mailinator.com
  return [...DISPOSABLE_DOMAINS].some((bad) => d.endsWith(`.${bad}`));
}
