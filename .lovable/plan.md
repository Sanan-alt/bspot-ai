# BSpot AI — Lemon Squeezy Payments Plan

You chose **Option 2: Lemon Squeezy as merchant of record** for `/app/buy-credits`. This plan explains exactly what you must do on the Lemon Squeezy side, what it costs, and what I will build on the Lovable side once you are approved.

No code changes are included in this plan. Implementation starts only after you approve it.

---

## 1. What you must do on Lemon Squeezy (PK seller)

### Step A — Create the account
1. Go to **lemonsqueezy.com** and sign up as a seller.
2. During onboarding, Lemon Squeezy will ask for:
   - Your **country of residence / business registration** (Pakistan).
   - Your **business type**: individual / sole proprietor, or registered company.
   - A valid **email address** (use `bspot.ai.official@gmail.com` or `msaoffical.sa@gmail.com` so the team has access).
3. **Important verification step**: after signup, confirm that Pakistan is accepted in the payout-country list. If Pakistan is blocked, stop and tell me — we will switch to a different provider before any code is written.

### Step B — Submit verification documents
Lemon Squeezy (and its payment processor) will typically ask for:
- **Government-issued photo ID**: NADRA CNIC front + back, or Pakistani passport.
- **Proof of address**: utility bill, bank statement, or mobile bill in your name (usually last 3 months).
- **Business proof (if company)**: SECP registration, NTN certificate, or business incorporation documents.
- **Tax form**: non-US sellers usually complete a **W-8BEN** tax form inside the Lemon Squeezy dashboard to avoid US withholding tax.

### Step C — Connect a payout method
Because Pakistani Rupee (PKR) direct local-bank payouts are not guaranteed, be ready with one of these:
- **Wise (formerly TransferWise)** account — recommended. You can open a USD/EUR/GBP balance and withdraw to your Pakistani bank.
- **PayPal** business account (if available for your profile).
- **Payoneer** account — another common route for Pakistani sellers.

Lemon Squeezy will show you which payout methods are available once your country is verified.

### Step D — Approval time
- Typical approval: **1–3 business days** if documents are clear.
- Sometimes up to **7 business days** during busy periods or if extra verification is needed.

### Step E — Create the three credit packs
Once approved, create these products in Lemon Squeezy:

| Pack | Credits | Price (PKR) | Price (USD) |
|---|---|---|---|
| Starter | 200 | 150 | ~0.55 |
| Pro | 1,000 | 800 | ~2.85 |
| Power | 5,000 | 3,500 | ~12.50 |

Each pack becomes a **Product + Variant** in Lemon Squeezy. You will copy the **Variant ID** for each one and give it to me so I can wire the checkout buttons.

---

## 2. Costs and fees

### Lemon Squeezy fees
- **No monthly fee**, no setup fee.
- **Transaction fee**: **5% + $0.50 per successful transaction**.
- This is all-inclusive: payment processing, fraud protection, tax compliance (VAT/sales tax), and merchant-of-record benefits.

### Example cost breakdown on a PKR 800 Pro pack
Assume USD/PKR rate ≈ 280:
- Sale amount: ~$2.85
- Lemon Squeezy fee: 5% of $2.85 + $0.50 = ~$0.14 + $0.50 = **~$0.64**
- You receive: ~$2.21

### Other possible costs
- **Currency conversion**: if Lemon Squeezy settles in USD and you withdraw to PKR, Wise/Payoneer/PayPal will charge their own conversion fee (usually 0.5%–2%).
- **Payout fee**: depends on the payout method (Wise is generally cheapest).
- **Refund / chargeback**: Lemon Squeezy handles the process; chargeback fees are deducted from your balance if they occur.

---

## 3. Lovable-side integration work (after you are approved)

Once you give me the Lemon Squeezy credentials and variant IDs, I will implement the following:

### Secrets to add in Lovable Project Settings
- `LEMON_SQUEEZY_API_KEY` — from Lemon Squeezy → Settings → API.
- `LEMON_SQUEEZY_STORE_ID` — your store ID.
- `LEMON_SQUEEZY_WEBHOOK_SECRET` — used to verify webhook signatures.

### Backend work
1. **Create a checkout server function**
   - Accepts the chosen pack.
   - Calls Lemon Squeezy API to create a hosted checkout URL.
   - Returns the checkout URL to the client.

2. **Create a public webhook route** at `/api/public/lemonsqueezy`
   - Verifies the webhook signature using `LEMON_SQUEEZY_WEBHOOK_SECRET`.
   - Listens for `order_created` / `order_paid` events.
   - On successful payment, calls `grant_credits` RPC to add credits to the user's account.
   - Stores the order record in the credit history table.

3. **Receipt email**
   - Reuses the existing `src/lib/email-templates/receipt.tsx` template.
   - Sends a purchase receipt to the user's email after a successful order.

### Frontend work
1. **Update `/app/buy-credits`**
   - Replace the "Notify me when live" buttons with real **Buy now** buttons.
   - Each button calls the checkout function and redirects the user to Lemon Squeezy's hosted checkout page.
   - Show a "Processing…" state while the checkout URL is generated.

2. **Post-purchase success handling**
   - After payment, Lemon Squeezy redirects the user back to `/app/buy-credits?success=1`.
   - The page shows a success toast and refreshes the credit balance.

3. **Failure / cancel handling**
   - If the user cancels, they return to `/app/buy-credits?canceled=1`.
   - The page shows a friendly "Payment canceled" message.

### Files that will be touched
- Add `src/lib/lemonsqueezy.functions.ts` — checkout creation.
- Add `src/routes/api/public/lemonsqueezy.ts` — webhook handler.
- Edit `src/routes/app.buy-credits.tsx` — real purchase buttons.
- Edit `src/lib/email-templates/receipt.tsx` — minor formatting if needed.
- Possibly add a migration for an `orders` table if credit history is not enough to store Lemon Squeezy order IDs.

### Testing plan
1. Use Lemon Squeezy's **test mode** to simulate a purchase.
2. Confirm credits are granted after the webhook fires.
3. Confirm receipt email is sent.
4. Confirm failed/canceled payments do not grant credits.
5. Switch to live mode only after test mode works end-to-end.

---

## What I need from you before implementation

1. Confirm this plan.
2. Complete Lemon Squeezy signup and tell me whether Pakistan payouts are accepted.
3. Send me the three **Variant IDs** from your Lemon Squeezy products.
4. Add the three secrets listed above in Lovable Project Settings → Secrets.

Once those four items are done, I will build the integration in the next step.
