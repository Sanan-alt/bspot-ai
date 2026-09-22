# Signup, Email Verification & Account Security Pack

## What changes for users

1. **Credits are earned, not given away.** A new account still shows 100 credits (50 for demo/guest), but for email signups the credits stay locked as "pending" until the person clicks the confirmation link in their email. Guest/demo sessions keep their 50 immediately since there is no email to confirm.
2. **Eye icon on every password box** — on sign up, sign in, and the change-password box in Settings. Hidden by default, tap to reveal.
3. **Welcome email on signup, and a "new sign-in" alert email** when someone logs in from a device we haven't seen before.
4. **Real email checks at signup**: throwaway/disposable domains (Mailinator, Guerrilla Mail, temp-mail, etc.) are rejected with a clear message, and the address must be confirmed before the account is active.
5. **Abuse limits**: a cap on how many accounts can be created from one internet address per hour, plus the existing lockout after 5 failed sign-in attempts.
6. **Password change signs you out everywhere**, so you have to log back in with the new password.

## What is already handled by the platform (no work needed, stated for the record)

- Passwords are already stored as bcrypt hashes by the authentication service — the app never sees or stores a password.
- The site is served over HTTPS only, with HSTS from the hosting edge.
- All data access goes through parameterised queries plus row-level security, so SQL injection is not reachable; React escapes rendered text, covering XSS.
- Backend calls are same-origin POST requests carrying a bearer token rather than cookies, which is the standard CSRF-immune pattern; no ambient cookie auth exists to forge.
- Every API key (AI, news, market data, service keys) already lives in server-side secrets and is never bundled into the browser.
- Password-reset links are single-use and already expire.

## Technical plan

### Database migration
- `credits`: add `pending_balance int not null default 0`.
- `handle_new_user()`: for non-anonymous users insert `balance = 0, pending_balance = 100` and log a `signup_bonus_pending` transaction; anonymous demo users keep the immediate 50.
- New `release_pending_credits()` SECURITY DEFINER RPC: if the caller's JWT shows a confirmed email and `pending_balance > 0`, move pending into balance and write a `signup_bonus` transaction. Idempotent.
- New `signup_attempts` table (ip_hash, email_hash, fingerprint, created_at) + `check_signup_rate_limit(p_ip_hash, p_fingerprint)` RPC returning `{allowed, reason, retry_after}`; caps 3 signups/hour per IP hash and 2 per device fingerprint. GRANTs and RLS: no client reads, service role only; RPCs are the access path.

### Server functions (`src/lib/signup-guard.functions.ts`)
- `preSignupCheckFn` (public): validates format, rejects a disposable-domain blocklist (`src/lib/disposable-domains.ts`), checks MX-style deliverability via a DNS-over-HTTPS lookup on the domain (returns "email not found" when the domain cannot receive mail), hashes the caller IP from request headers and calls the rate-limit RPC.
- `recordSignupAttemptFn` (public) writes the attempt row after a successful `signUp()`.
- `notifyNewDeviceFn` (authenticated): hashes user agent + platform into a device id, stores it on `profiles.known_devices`, and queues the login-alert email only for a device id not seen before.

### Email
- Two new templates in `src/lib/email-templates/`: `welcome.tsx` and `login-alert.tsx`, registered in `registry.ts`, styled to the BSpot neon/dark brand with a white email body.
- Sent through the existing transactional email pipeline (queued provider delivery, not raw SMTP).

### Frontend
- `Field` in `src/routes/signup.tsx` gains a reveal toggle for `type="password"`; used by sign-in automatically. Settings password box gets the same toggle.
- Signup flow: call `preSignupCheckFn` → on failure show the specific error and do not create the account → on success `signUp()` with `emailRedirectTo` to a new `/auth/confirmed` route → show a "check your inbox" state instead of navigating into the app.
- New `/auth/confirmed` route: calls `release_pending_credits()`, sends the welcome email, then routes into the app.
- Credits UI (`use-credits`, `CreditsBadge`, buy-credits page) shows "100 pending — confirm your email to unlock" when `pending_balance > 0`.
- Sign-in calls `notifyNewDeviceFn` after a successful login.
- Settings: after a password change, sign out globally and send the user back to sign-in.

## Note on one item
Session tokens are managed by the authentication service and stored in browser storage, not httpOnly cookies — that is how this stack works and it cannot be swapped without replacing the auth system. Tokens are short-lived and rotate; the protection against theft is the HTTPS/HSTS + XSS-escaping already in place.
