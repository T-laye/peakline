# Peakline API: frontend integration guide (tranche 3)

Audience: web/mobile frontend team. Everything here is live on the `v2` backend build. Swagger (`/docs`, dev only) has the full schemas; this guide covers behaviour, flows and what changed.

---

## 0. Read this first: breaking changes

| # | Area | What changed | What you must do |
|---|---|---|---|
| 1 | **Reconciliation** `GET /merchant/reconciliation*` | Response shape rewritten. Rows are now payments, refunds and flagged payments. Removed: `transactionId`, `status`, `currency`, `paymentLink`, `fundingIntent`, `failureReason`. New fields in §7.2. `:txId` route is now `:reference`. Status `amount_mismatch` kept, new statuses added | Update types, table columns, filters |
| 2 | **Dashboard** `GET /merchant/dashboard/stats` | Figures are now scoped to the merchant's **businesses only** (personal wallet is excluded). New fields, `totalSent` now includes refunds, chart buckets gained `refunds` | Update types; new optional `businessId` filter |
| 3 | **Payment link status** | `active` is gone from responses. New lifecycle: `pending`, `processing`, `paid`, `expired`, `cancelled`, `flagged`. `active` is still accepted as a **filter** alias of `pending` | Map statuses in badges and filters |
| 4 | **`GET /payment-links/:id/payments`** | Returns payment-request rows (§3.5), not `TransactionDto` | Update the payments table |
| 5 | **`expiresAt` on create is optional** | Defaults to 30 days when omitted | Make the "due date" field optional |
| 6 | **External sends** `POST /transfers/send` | May return `status: "processing"` instead of completing or throwing. New required handling in §5 | Show a "confirming" state; never resend |
| 7 | **Transfer status** `status` | `processing` now occurs for on-chain sends and refunds; failed transfers now carry `failureReason` | Handle the new state |
| 8 | **Transaction `type`** | New value `refund` (outgoing). `GET /transactions` can return it | Add to type maps/labels |
| 9 | **Notification `type`** | New: `payment_flagged`, `refund_completed`, `refund_failed`. `payment_link_paid` and `payment_failed` are now actually emitted | Add copy and routing |
| 10 | **Link create validation** | `customerEmail` must be a valid email; `reference` must be 3-40 chars `[A-Za-z0-9._-]` and unique per business (409 on duplicate) | Surface 409/400 on the form |

`Idempotency-Key` is **not required** anywhere (see §5.4). Do not remove it if you already send it.

---

## 1. Conventions

- **Base URL:** `/api/v1`
- **Headers on every request:** `peakline-ref: <client app key>`; protected routes also `Authorization: Bearer <accessToken>`.
- **Success envelope:** `{ statusCode, message, timestamp, data }`
- **Paginated envelope:** `{ statusCode, message, timestamp, data: [...], meta: { totalCount, pageCount, currentPage, limit, prevPage, nextPage } }`. Query: `page` (default 1), `limit` (default 20, **max 100**).
- **Error envelope:** `{ statusCode, error, code?, message, details?, path, requestId, timestamp }`. Log/show `requestId` in support dialogs. `details.issues` is a string[] of machine-readable reasons when present (§5.2, §4.4).
- **Money:** always a **decimal string**, never a number. Most amounts have 7 decimals (`"50.0000000"`); dashboard figures have 2 (`"50.00"`). Send amounts as strings with up to 7 decimals, `> 0`. Never use JS floats for arithmetic; use a decimal library.
- **Dates:** ISO-8601 UTC strings. Date filters (`from` inclusive, `to` exclusive) must be valid ISO dates; `2026-W05`-style values return 400.
- **Currency:** USDC only for payments/refunds.
- **CSV endpoints** require the Bearer header, so a plain `<a href>` will not work. Fetch with auth, then save the blob. Capped at 10,000 rows.
- **Rate limits:** 429 on excess. Response header `X-RateLimit-Remaining`. Public `/pay/*` endpoints are the tightest.
- **Auth failures:** 401 missing/invalid token, 403 not a merchant account (merchant routes).

---

## 2. Payment request lifecycle

A **payment link** is the existing object. It has a `kind`:

- `link`: reusable, many payers, never becomes `paid` (stays `pending` until it expires or is cancelled).
- `request`: customer-specific, single use. Created automatically when any of `customerName`, `customerEmail`, `customerPhone` is sent. Becomes `paid` once.

| status | meaning | merchant can cancel? |
|---|---|---|
| `pending` | awaiting payment (not past due) | yes |
| `processing` | payer reported a payment hash and it was verified on Stellar; waiting for the ledger credit | **no (409)** |
| `paid` | correct payment confirmed on Stellar | no (409) |
| `expired` | due date passed unpaid. A `pending` request past its deadline is **already returned as `expired`** | yes |
| `cancelled` | merchant cancelled | already (400) |
| `flagged` | a payment arrived that needs manual review (wrong amount) | yes |

Cancelling or expiring never reverses a payment already sent on Stellar. Such a payment is credited and **flagged** (§3.7).

**Payment instructions (what a payer must do):** send USDC on Stellar to `destinationAddress` for exactly `amount`, with the Stellar **text memo** `memo` (= the link's `publicCode`). Without the memo the payment cannot be matched automatically; the merchant gets a flag. Wallet users can skip all of that with `paymentUri` (SEP-7), which the QR encodes.

---

## 3. Payment links and requests (merchant)

All routes below need a **merchant** token.

### 3.1 Create `POST /payment-links` → 201

```json
{
  "title": "Invoice 42",
  "amount": "250.00",
  "currency": "USDC",
  "businessId": "<uuid>",
  "description": "optional",
  "expiresAt": "2026-12-31T00:00:00Z",
  "reference": "INV-042",
  "customerReference": "optional",
  "customerName": "Ama Mensah",
  "customerEmail": "ama@example.com",
  "customerPhone": "+233..."
}
```
`reference` is generated (`PK-XXXXXXXX`) when omitted. Errors: 400 validation / `expiresAt` in the past, 403 business not yours or **suspended**, 409 duplicate `reference` in that business.

Response (`PaymentLinkDto`): `id, reference, kind, title, amount, currency, description, customerReference, customerName, customerEmail, customerPhone, expiresAt, cancelledAt, paidAt, status, publicCode, url, business{id,name}, createdAt, updatedAt`. `url` is the shareable page; render it from `publicCode`.

### 3.2 List `GET /payment-links`
Filters: `q` (title, reference, customer name/email/reference), `status` (`pending|processing|paid|expired|cancelled|flagged`, plus legacy `active`), `kind` (`link|request`), `businessId`, `reference` (exact), `customer` (partial name/email), `minAmount`, `maxAmount`, `from`, `to` (on `createdAt`), `page`, `limit`. Sorted newest first.

### 3.3 Counters `GET /payment-links/stats`
`{ total, pending, active (= pending), processing, paid, expired, cancelled, flagged }`.

### 3.4 Collections overview `GET /payment-links/collections?businessId=`
Customer **requests only** (reusable links excluded): `{ outstanding, completed, expired, cancelled }`, each `{ amount, count }`. `outstanding` = pending + processing + flagged.

### 3.5 Detail, QR, payments, cancel, export
- `GET /payment-links/:id`
- `GET /payment-links/:id/qr` → `{ paymentUri, qrDataUrl }` (`qrDataUrl` is a PNG data URL, use as `<img src>`).
- `GET /payment-links/:id/payments` (paginated) → `{ id, status: "processing"|"matched", stellarTxHash, amount, fromAddress, paidAtChain, transactionId, createdAt }`. `processing` = payer reported it, awaiting credit; `matched` = credited. Show `stellarTxHash` with a link to a Stellar explorer.
- `POST /payment-links/:id/cancel` → 200. 400 already cancelled; **409** if paid or a payment is being verified.
- `GET /payment-links/export.csv` (same filters as the list, no pagination).

### 3.6 Search/filter UI mapping
Customer = `customer`; date = `from`/`to`; amount = `minAmount`/`maxAmount`; status = `status`; reference = `reference`.

### 3.7 Flagged payments (manual review) `GET /payment-links/flags`
A payment to the merchant wallet that could not be matched cleanly. Query: `state=open|resolved|all` (default `open`), `businessId`, paging.

Item: `{ id, businessId, paymentLinkId, reason, stellarTxHash, amount, assetCode, fromAddress, transactionId, resolvedAt, note, createdAt }`.

`reason` values and suggested copy:

| reason | meaning | credited to balance? |
|---|---|---|
| `wrong_amount` | amount differs from the request | yes |
| `no_memo` | no memo on the payment | yes |
| `unknown_memo` | memo matches no link of this business | yes |
| `expired_request` | paid after the due date (judged by the payment's own time) | yes |
| `cancelled_request` | request was cancelled | yes |
| `duplicate_payment` | request was already paid | yes |
| `wrong_asset` | not USDC (e.g. XLM) | **no** |
| `wrong_issuer` | USDC from an unrecognised issuer | **no** |
| `ingest_error` | could not be processed automatically | **no** (needs support) |
| `wallet_deactivated` | received by a deactivated wallet | **no** |

`transactionId != null` means it was credited. `POST /payment-links/flags/:flagId/resolve` with `{ "note": "..." }` marks it reviewed (404 not yours, 409 already resolved). A `flagged` request returns to `pending` when its last open flag is resolved.

---

## 4. Refunds (merchant)

### 4.1 Flow
1. `GET /refunds/eligible-payments`: payments that still have a refundable balance.
2. User picks a payment, enters amount and reason → `POST /refunds` (status `requested`).
3. Confirmation screen: `GET /refunds/:id` (show `recipientAddress`, `amount`, `refundable`).
4. User enters their transaction PIN → `POST /refunds/:id/authorize` (status `processing`, then `completed` or `failed`).
5. Poll `GET /refunds/:id` (or react to the notification) until `completed`/`failed`.

States: `requested → authorized → processing → completed | failed`. `authorized` is only seen when the business balance was too short to start (see 4.4).

### 4.2 Eligible payments `GET /refunds/eligible-payments?businessId=` (paginated)
Item: `{ transactionId, businessId, amount, payerAddress, stellarTxHash, paymentLinkId, reference, customerReference, completedAt, refundable }`.
`refundable` (also on refund detail): `{ paymentAmount, refunded, pending, remaining }`. `remaining` already excludes completed refunds **and** refunds still in flight (they are reserved). Example: 200 paid, 50 refunded, 100 in flight → `remaining` 50; asking for 75 is rejected.

### 4.3 Create `POST /refunds` → 201
```json
{ "originalTransactionId": "<uuid>", "amount": "50.00", "reason": "Customer returned item", "idempotencyKey": "<client uuid>" }
```
- `idempotencyKey` is **required** here (8-100 chars). Generate a UUID when the refund dialog opens and reuse it if the user clicks again or the request is retried. Same key + same payment + same amount returns the **same refund** (not an error). Same key with a different payment/amount → 409.
- `reason`: 3-500 chars.
- Refund always goes **back to the original payer address** (not editable).
- Errors: 404 payment not yours; **422** exceeds the remaining refundable balance (message says how much remains), or payment not completed / has no sender address; **403** business suspended/deleted.

Refund (`RefundDto`): `id, businessId, originalTransactionId, amount, currency, reason, recipientAddress, status, stellarTxHash, failureReason, ledgerTransactionId, authorizedAt, completedAt, createdAt, updatedAt, refundable?` (`refundable` only on detail).

### 4.4 Authorize `POST /refunds/:id/authorize` `{ "pin": "1234" }`
Owner's transaction PIN (same PIN as sending money).
- 401 `INVALID_PIN`, 403 `PIN_LOCKED` (15 min after 5 wrong tries), 403 `PIN_NOT_SET` (route to set-PIN flow).
- **422 with `details.issues`**: "cannot be sent right now". Refund stays `requested`. Issues: `destination_account_not_found`, `destination_missing_usdc_trustline`, `source_*` (business wallet problems). Show a readable explanation, let the merchant retry later or cancel.
- **422 "Insufficient USDC balance"**: PIN was accepted but the business balance is too low; the refund is `authorized`. After the balance is topped up call `POST /refunds/:id/execute` (no PIN needed).
- 409 already authorized/processing.
- 200 returns the refund (usually `processing`; may already be `completed`).

### 4.5 Other
- `POST /refunds/:id/execute`: retry an `authorized` refund that could not start.
- `POST /refunds/:id/cancel`: only while `requested`/`authorized` (409 otherwise). It ends as `failed` with `failureReason: "Cancelled by merchant"`; the reserved amount is released.
- `GET /refunds`: history. Filters `status`, `businessId`, `originalTransactionId`, `from`, `to`.
- A `failed` refund does **not** count as refunded and its balance is restored. A `completed` refund creates a `refund` transaction visible in `GET /transactions`.
- Refund and business-balance effects appear in the dashboard and reconciliation (§7).

---

## 5. Transfers (wallet sends)

### 5.1 Preview before signing `POST /transfers/preview`
Same body as send **without `pin`**. Nothing is signed or debited.
```json
{ "type": "external", "amount": "30", "asset": "USDC", "network": "testnet",
  "recipient": "G...", "fee": { "amount": "0.0000100", "currency": "XLM" },
  "balanceAfter": "70.0000000", "canSend": true, "issues": [] }
```
- `type`: `internal` (instant, free, `network: null`) or `external` (on-chain).
- Show recipient, amount, asset, **network (Stellar Testnet)** and fee on the confirmation screen.
- If `canSend` is false show `issues`: `insufficient_balance`, `no_wallet`, `source_account_not_found`, `source_missing_usdc_trustline`, `source_insufficient_usdc`, `source_insufficient_xlm_for_fee`, `destination_account_not_found`, `destination_missing_usdc_trustline`.
- Invalid Stellar addresses return 400 (checksum validated).

### 5.2 Send `POST /transfers/send`
Body unchanged (`mode`, recipient fields, `amount`, `pin`, optional `note`). Response now includes `status`:

| `status` | meaning | UI |
|---|---|---|
| `completed` | done (internal transfers, or on-chain confirmed) | success |
| `processing` | submitted, Stellar outcome not known yet | "Confirming…"; **never send again** |
| (HTTP 503) | Stellar rejected it, balance restored | failure with the message |

- A 422 with `details.issues` means it was refused **before anything was debited** (destination cannot receive USDC, wallet missing XLM for the fee, etc.). Same issue codes as 5.1.
- A `note` is used as the Stellar memo only when ≤ 28 **bytes**; longer/multibyte notes are kept on the transaction but not put on-chain.
- Response also has `stellarTxHash` (present as soon as the payment is signed, even while `processing`).

### 5.3 Status, recheck, retry
- `GET /transfers/:id` → adds `failureReason` and `stellarTxHash`; `status` is `pending|processing|completed|failed|reversed`. Poll every few seconds while `processing`.
- `POST /transfers/:id/recheck` → asks Stellar again and returns the status. Use for a "Check status" button on a `processing` transfer. Safe to press repeatedly.
- `POST /transfers/:id/retry` `{ "pin" }` → only for `failed` transfers. 409 if it succeeded/may still complete (message says to recheck instead). 503 if Stellar cannot be reached to confirm the original; retry shortly. **No idempotency header needed.**
- `GET /transfers/verify/:hash` unchanged.

### 5.4 Duplicate protection (server side)
You do **not** need to send an `Idempotency-Key`. The server treats an identical send (same sender, recipient, amount and note) while an earlier one is still live (pending, processing or completed within 60 seconds) as the **same payment** and returns the original transfer, so a double click or a resend after a timeout cannot pay twice. Consequences for the UI:
- A repeated submit returns **200 with the same `transactionId`**. Do not show it as a second payment.
- Two genuinely identical payments within 60 s will merge; if that must be possible, send an explicit `Idempotency-Key` header (8-100 chars, unique per payment) to override. A key reused with a different amount/recipient returns 409.
- A failed payment never blocks a new attempt.

### 5.5 Transaction history
`GET /transactions` additionally returns `type: "refund"` (direction `outgoing`) and `status: "processing"` rows. Wallet and merchant views read the same records, so statuses and hashes agree.

---

## 6. Public payment page (no auth, `peakline-ref` header only)

| Route | Purpose |
|---|---|
| `GET /pay/:code` | `{ reference, title, amount, currency, description, expiresAt, status, businessName, destinationAddress, memo, paymentUri }` |
| `GET /pay/:code/qr` | `{ paymentUri, qrDataUrl }` |
| `POST /pay/:code/payment-hash` `{ hash }` | payer-reported hash (below) |
| `POST /pay/:code/claim` `{ fromAddress }` → 201 | external-wallet flow step 1 |
| `POST /pay/:code/claim/:claimId/verify` `{ txHash }` | external-wallet flow step 2 |

Show a banner by `status`: `paid` ("already paid"), `cancelled`, `expired`, otherwise the payment instructions (address, amount, **memo**, QR).

### 6.1 "I've paid" with the hash `POST /pay/:code/payment-hash`
Body `{ "hash": "<64 hex>" }`. The server verifies on Stellar that it succeeded, carries this link's memo and pays the exact amount to the merchant. Result `{ status: "processing"|"matched", stellarTxHash }`. The request only turns `paid` after the ledger credit (usually within seconds); poll `GET /pay/:code`.
Errors: 400 wrong memo/amount/failed tx; 404 hash not on Stellar yet (retry in a few seconds); 409 already paid / cancelled / **paid after the due date** / hash already recorded; 503 could not reach Stellar (retry).

### 6.2 External wallet flow (claim, then verify)
1. `POST /pay/:code/claim` `{ "fromAddress": "G..." }` (the wallet they pay from) → `{ id, paymentLinkId, fromAddress, txHash, status: "pending", failureReason, createdAt, updatedAt }`. Max 20 open claims per link (429).
2. Payer pays **with the link's memo**, then you call `POST /pay/:code/claim/:claimId/verify` `{ "txHash": "<64 hex>" }`.
- **200** `status: "settled"`: the payment settled this request.
- **400** failed, with a message (also saved as `failureReason`): transaction failed, **memo missing or for another link**, payment not USDC, wrong sender/recipient, or **"Payment received but flagged for merchant review (reason)"**. In the flagged case the money did arrive; tell the payer the merchant will review it. A failed claim cannot be retried: create a new claim.
- **404** transaction not on Stellar yet: claim stays `pending`, retry in a few seconds.
- **503** could not reach Stellar: claim stays `pending`, retry.
- **409** already settled, or the transaction was already used by another claim.
- May be called after the link expired; the payment's own time decides whether it was on time.
- Hash is case-insensitive (normalised to lower-case).

---

## 7. Merchant reporting

All routes accept optional `businessId` (404 if not yours) and cover **all your businesses** by default. Personal wallet activity is never included.

### 7.1 Dashboard `GET /merchant/dashboard/stats?period=week|month|year&businessId=&from=&to=`
Response (all money 2-decimal strings):
- `totalReceived`, `totalSent` (withdrawals + transfers + **refunds**), `todaysPayments`, `todaySent`, `refundsCompleted`, `netCollections` (received − refunds), `usdcVolume`. Each is `{ amount, currency, changePct|null, changeVsLabel }`.
- `pending` `{ amount, currency, count }`: open funding intents.
- `outstandingRequests`, `completedCollections`, `pendingRefunds`: `{ amount, currency, count }`.
- `chart`: `{ period, currency, totalInflow, totalOutflow, totalRefunds, buckets: [{ label, inflow, outflow, refunds }] }`. `outflow` excludes refunds.
`from`/`to` bound the totals only. The "Payments received 8,500 / Refunds 650 / Outstanding 2,300 / Net 7,850" cards map to `totalReceived`, `refundsCompleted`, `outstandingRequests`, `netCollections`.

### 7.2 Reconciliation `GET /merchant/reconciliation`
Rows (`ReconciliationDto`):
`reference` (payment transaction id | refund id | flag id), `transactionType` (`payment|refund|unmatched_payment`), `businessId`, `paymentRequestId`, `paymentReference` (PK-…), `customerReference`, `customerName`, `customerEmail`, `amount`, `asset`, `paymentStatus`, `refundStatus`, `stellarTxHash`, `counterpartyAddress`, `transactionDate`, `reconciliationStatus`.

- `refundStatus` on a **payment**: `pending | partially_refunded | refunded | null`. On a **refund**: its own status.
- `reconciliationStatus`: `matched` (tied to a request/intent, or refund tied to a confirmed payout), `unmatched`, `flagged`, `amount_mismatch`, `reviewed` (flag resolved), `pending` (refund in flight), `failed`.
- Filters: `status`, `type`, `businessId`, `customer`, `reference` (transaction id, request ref `PK-…` or Stellar hash), `q`, `from`, `to`, paging.
- `GET /merchant/reconciliation/summary` (same `businessId/from/to`) → counts per status + `total`.
- `GET /merchant/reconciliation/:reference` → one row (404 if not yours).
- `GET /merchant/reconciliation/export.csv` → columns exactly: `transaction_reference, payment_request_id, customer_reference, transaction_type, amount, asset, payment_status, refund_status, stellar_tx_hash, transaction_date, reconciliation_status`.

### 7.3 Reports `GET /merchant/reports/*` (`from`/`to`, default last 30 days)
- `summary` → `{ from, to, currency, paymentsReceived{amount,count}, refundsCompleted, netCollections, outstandingRequests, completedCollections, pendingRefunds, flaggedPayments, unmatchedPayments }` (amounts 7 decimals).
- `summary.csv` → `metric,amount,count` download.
- `activity?granularity=day|week|month` → `[{ periodStart, payments, refunds, net }]` (UTC; weeks start Monday).
- `payment-methods` → `[{ method, count, amount }]`, `method` ∈ `payment_request | payment_link | funding_intent | direct_stellar`.
- `customers?q=&page=&limit=` (paginated) → `[{ customerName, customerEmail, requests, paidRequests, paidAmount, outstandingAmount, lastRequestAt }]`.

---

## 8. Notifications (new/changed `type`)

| type | when | `data` |
|---|---|---|
| `payment_link_paid` | a request was marked paid | `{ paymentLinkId, transactionId }` |
| `payment_flagged` | a payment needs review | `{ reason, stellarTxHash, paymentLinkId }` |
| `refund_completed` | refund confirmed on Stellar | `{ refundId, stellarTxHash }` |
| `refund_failed` | refund failed, balance restored | `{ refundId, stellarTxHash }` |
| `payment_failed` | a wallet transfer failed, balance restored | `{ transactionId }` |

Deep-link by id.

---

## 9. Error handling cheat-sheet

| HTTP | Typical cause | UX |
|---|---|---|
| 400 | validation, bad hash/address, link cancelled/expired, claim rejected | show `message` |
| 401 | no/invalid token; `INVALID_PIN` | re-auth / "wrong PIN" |
| 403 | not a merchant; `PIN_LOCKED` / `PIN_NOT_SET`; business suspended | explain / route to PIN setup |
| 404 | not found or not yours; tx not on Stellar yet | retry where noted |
| 409 | state conflict (already paid/settled/retried, key reuse, duplicate reference) | refresh the object |
| 422 | business rule (refund exceeds balance, cannot be sent) | show `message`; `details.issues` for reasons |
| 429 | rate limit | back off |
| 503 | Stellar unreachable / Stellar rejected a transfer | "Try again shortly" |

Money-moving requests must never be blindly auto-retried by the client on timeout. Instead call `GET /transfers/:id` / `POST /transfers/:id/recheck` (transfers) or `GET /refunds/:id` (refunds). The backend rechecks Stellar before it ever pays again.

## 10. Backend deploy notes that affect you
- Stellar network is Testnet; USDC is the Testnet asset.
