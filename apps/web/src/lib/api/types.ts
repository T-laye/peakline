/**
 * Response shapes for the backend's `/docs-json` DTOs (NestJS/Swagger,
 * `https://peakline-backend-production.up.railway.app/docs`) — auth module
 * only, for now. Request payload shapes are typed inline where they're
 * built (see `features/auth/hooks/index.ts`) rather than mirrored here,
 * matching how the sibling med-archive client project splits these.
 */

/** Every successful response's envelope shape. */
export interface ApiSuccessResponse<T = unknown> {
	statusCode: number;
	message: string;
	timestamp: string;
	data: T;
}

/** A NestJS default-exception-filter error body, confirmed live against the
 * real backend — `message` can be a single string or (from class-validator)
 * an array of them; `code` is only present on some errors (e.g.
 * "INVALID_CREDENTIALS" on a bad login) and absent on others. */
export interface ApiErrorResponse {
	statusCode: number;
	error?: string;
	message?: string | string[];
	code?: string;
	/** `details.issues`: machine-readable reasons on 422s from refunds and
	 * transfers (e.g. `destination_missing_usdc_trustline`). */
	details?: { issues?: string[] } & Record<string, unknown>;
	/** Show in support dialogs. */
	requestId?: string;
	path?: string;
	timestamp?: string;
}

export interface AuthTokensData {
	/** Short-lived JWT — send as `Authorization: Bearer <accessToken>`. */
	accessToken: string;
	/** Long-lived, single-use. Reusing a consumed one revokes the whole
	 * token family (all devices), so always persist the newest one and
	 * never retry a request with a stale one. */
	refreshToken: string;
	/** Access token lifetime, in seconds. */
	expiresIn: number;
	tokenType: "Bearer";
	/** Not live yet as of this writing (still absent from `/docs-json`) —
	 * the backend team says both are being added to the login/verify-email
	 * response. Optional so this type keeps working either way; once
	 * present, `authStore.setTokens` uses these directly instead of falling
	 * back to its own client-side customerType cache (see that store's own
	 * note on why that cache exists at all). */
	customerType?: CustomerType;
	userRole?: UserRole;
}

/** Returned by `/auth/register` and `/auth/resend-otp`. */
export interface OtpSentData {
	ttlSeconds: number;
}

/** `PATCH /users/pin` — step 1 of changing an existing PIN. Doesn't apply
 * the new PIN yet: `requiresTwoFa` says whether the confirmation step
 * (`POST /users/pin/confirm`) needs a TOTP code instead of the email OTP
 * this always sends otherwise. */
export interface PinChangeInitiatedData {
	requiresTwoFa: boolean;
	ttlSeconds: number;
}

export type OtpPurpose =
	| "email_verification"
	| "phone_verification"
	| "password_reset";

export type CustomerType = "individual" | "merchant";

/** "staff" covers admin/super_admin-style backend roles (see
 * `PATCH /config/stellar/stage`'s "admin or super_admin staff role"
 * requirement) — there's no admin app in the MVP (CLAUDE.md), so this isn't
 * acted on anywhere yet, just captured since it now rides along on login. */
export type UserRole = "staff" | "customer";

/** `POST /onboarding/individual` — all fields optional on the wire (partial
 * update), but our own form always collects and sends all four. A separate
 * `POST /onboarding/merchant` now also exists — not yet reconciled with
 * this one + the standalone `POST /businesses` call `useCompleteSignUp`
 * currently makes for merchant accounts; needs its own look before
 * switching over. */
export interface UpdateProfileData {
	/** "YYYY-MM-DD". */
	dateOfBirth?: string;
	/** ISO 3166-1 alpha-2, e.g. "GH" — not a display name. */
	nationality?: string;
	residentialAddress?: string;
	city?: string;
}

export interface SetPinData {
	pin: string;
}

/** `GET /users/me`. Real account fields — `PATCH /users/me` only accepts a
 * subset of these (see `UpdateProfileFieldsDto`); email/phone changes have
 * no endpoint yet ("go through a separate verified-change flow" per the
 * docs, not shipped). */
export interface ProfileData {
	id: string;
	firstName: string;
	lastName: string;
	otherName?: string | null;
	email: string;
	phoneNumber: string;
	countryCode: string;
	nationality?: string | null;
	dateOfBirth?: string | null;
	residentialAddress?: string | null;
	city?: string | null;
	customerType?: CustomerType | null;
	kycTier: number;
	username?: string | null;
	avatarUrl?: string | null;
	emailVerifiedAt?: string | null;
	phoneVerifiedAt?: string | null;
	deletionRequestedAt?: string | null;
	deletionScheduledAt?: string | null;
	createdAt: string;
}

/** Fields `PATCH /users/me` actually accepts — a subset of `ProfileData`. */
export interface UpdateProfileFieldsData {
	firstName?: string;
	lastName?: string;
	otherName?: string;
	username?: string;
	avatarUrl?: string;
}

/** `POST/DELETE /users/me/deletion-request`. */
export interface AccountDeletionStatusData {
	deletionRequestedAt: string | null;
	deletionScheduledAt: string | null;
	graceDays: number;
}

export interface WalletBusinessData {
	id: string;
	name: string;
}

/** One entry per currency this wallet actually holds — confirmed live
 * (`GET /wallets/stellar`'s own response): "USDC is live from Horizon; GHS
 * from internal ledger." `useWalletBalance` (the Dashboard's `BalanceCard`,
 * `WalletBalanceCard`, and the Send/Fund/Pay success + validation steps
 * that all share that hook) reads this ALONGSIDE `GET /transactions/
 * balances` (`BalanceData`, below) and takes the higher of the two per
 * currency — see that hook's own note on why neither source is complete by
 * itself: this one is on-chain/Horizon-live for USDC, so it can miss a
 * purely-internal transfer from another Peakline user (settled through the
 * ledger with no on-chain movement at all, confirmed live on
 * `SendMoneyResponseDto`'s own `stellarTxHash: null` for that case); the
 * ledger rollup can just as easily miss funds added outside any recorded
 * transaction (e.g. the testnet faucet). */
export interface WalletBalanceItemData {
	currency: string;
	amount: string;
}

/** `POST/GET /wallets/stellar`, `GET /wallets/stellar/list`. `business` is
 * only ever attached by the list endpoint — present (non-null) on a
 * business's own wallet, omitted entirely on the single get/create
 * endpoints (which only ever return the caller's personal wallet).
 * `ownerType`/`balances` confirmed live — not in `walletType`/`network`/
 * `publicKey`/`createdAt`'s own required set per the spec, but present on
 * every real response seen so far; kept optional to match the documented
 * contract rather than assume they're always there. */
export interface StellarWalletData {
	id: string;
	walletType: CustomerType;
	ownerType?: CustomerType;
	network: "mainnet" | "testnet";
	publicKey: string;
	label?: string | null;
	federationAddress?: string | null;
	deactivatedAt?: string | null;
	createdAt: string;
	business?: WalletBusinessData | null;
	balances?: WalletBalanceItemData[];
}

/** `GET /wallets/lookup/{userId}` — confirmed live. Resolves any user id to
 * just enough to pay them: a display `name` ("business name for merchants
 * with a registered business, or firstName + lastName for individuals",
 * per the endpoint's own description) and the wallet's `publicKey` to send
 * to. Deliberately excludes balance and any key material. This is the
 * lookup the receive-via-QR/link flow needed (see `lib/wallet.ts`'s
 * `buildReceiveLink` and `useWalletLookup`) — the live spec documents its
 * 401/404 but not the 200 body; `name`/`publicKey` are the two fields the
 * description explicitly promises, so those are what's typed here. */
export interface WalletLookupData {
	name: string;
	publicKey: string;
}

/** `GET /wallets/search` — confirmed live. Pass `phone`+`countryCode`
 * (exact match) or `name` (case-insensitive prefix search across first
 * name, last name, and business name, min 2 chars) — never both. Returns
 * up to 20 matching active individual wallets, no balance or key material.
 * The "verify who you're sending to" step ahead of a regular Send (see
 * `useWalletSearch`, `RecipientSearchField`): a phone match confirms an
 * exact `mode: "phone"` recipient before the transfer fires; a name match
 * is a picker (multiple people can share a name), and whichever one gets
 * picked sends as `mode: "wallet"` against their own `publicKey` instead,
 * the same way a QR/link-resolved recipient does — "name" itself was never
 * a valid `SendMoneyDto.mode`. Same shape as `WalletLookupData` (only
 * `name`/`publicKey` confirmed by the endpoint's own description — no 200
 * schema is documented, same gap as that one) plus nothing else assumed. */
export interface WalletSearchResultData {
	name: string;
	publicKey: string;
}

export type FundCurrency = "USDC" | "GHS";

/** `POST /wallets/stellar/fund/quote` — a preview, not an action. */
export interface FundQuoteData {
	amount: string;
	currency: FundCurrency;
	network: string;
	/** Self-funding your own wallet is free — this is here for whenever
	 * that stops being universally true. */
	fee: string;
	receiveAmount: string;
	receiveCurrency: string;
	/** Live 1 USDC → GHS rate. */
	fxRate: string;
	/** GHS equivalent of `amount` — only set when `currency` is `"USDC"`. */
	fxEquivalent?: string | null;
}

/** `POST /wallets/stellar/fund` — the testnet faucet. Sends free test USDC
 * straight to `address`; there's no real funding *source* involved (no
 * card/bank/mobile-money — those don't exist on this backend), which is why
 * Fund Wallet no longer asks for one. Fails with 403 if the network is ever
 * switched to mainnet (`MAINNET_FAUCET_FORBIDDEN`) — a faucet has no
 * business existing there. */
export interface FundWalletResultData {
	txHash: string;
	amount: string;
	asset: string;
}

/** The `meta` sibling to `data` on every paginated list endpoint
 * (notifications, transactions). */
export interface PaginationMeta {
	totalCount: number;
	pageCount: number;
	currentPage: number;
	limit: number;
	prevPage: boolean;
	nextPage: boolean;
}

/** `GET /notifications`. `readAt` is `null`/absent until
 * `PATCH /notifications/{id}/read`, then an ISO timestamp — used as the
 * unread indicator rather than a separate boolean. */
export interface NotificationData {
	id: string;
	userId: string;
	businessId?: string | null;
	type: string;
	title: string;
	body: string;
	data?: Record<string, unknown> | null;
	readAt?: string | null;
	createdAt: string;
	updatedAt: string;
}

/** `POST/GET/PATCH /businesses`. `status` and the nullable fields are typed
 * loosely (`docs-json` itself only says `"type": "object"` for most of
 * them, likely a Swagger-decorator gap rather than an intentional shape) —
 * widen these once the real values are seen live. */
export interface BusinessData {
	id: string;
	ownerId: string;
	name: string;
	category: string;
	status: string;
	country: string;
	city?: string | null;
	address?: string | null;
	phone?: string | null;
	website?: string | null;
	logoUrl?: string | null;
	description?: string | null;
	registrationNumber?: string | null;
	taxId?: string | null;
	verifiedAt?: string | null;
	createdAt: string;
	updatedAt: string;
}

/** `GET /onboarding/merchant` — the merchant onboarding review screen's own
 * data: the profile plus whichever business onboarding registered ("the
 * oldest live business owned by the user", per the endpoint's own
 * description). `business` is `null` until `POST /onboarding/merchant` has
 * actually run at least once. `useCompleteSignUp` calls this GET right after
 * that POST purely to recover the new business's `id` — the POST's own
 * response is `data: null`, and the merchant setup form's `phone` field has
 * no home in `OnboardMerchantDto`, so it's set with a follow-up
 * `PATCH /businesses/{id}` once the id is known. */
export interface MerchantOnboardingReviewData {
	profile: ProfileData;
	business: BusinessData | null;
}

/** `GET /transactions/balances` — one entry per currency the account has
 * ever held (not necessarily both USDC and GHS present). `balance` is a
 * decimal string (Stellar/ledger precision), not a number — parse with
 * `Number()` before formatting. Briefly removed (along with the route that
 * returns it) when `useWalletBalance` moved to `StellarWalletData.balances`
 * alone, then restored once that switch turned out to trade one gap for
 * another — see `WalletBalanceItemData`'s own note and `useWalletBalance`'s
 * for why the hook now reads both. */
export interface BalanceData {
	currency: string;
	balance: string;
}

export type TransactionType =
	| "deposit"
	| "withdrawal"
	| "internal_transfer"
	| "conversion"
	| "withdrawal_ghs"
	/** Outgoing refund to a customer (v3). */
	| "refund";

export type TransactionLedgerStatus =
	| "pending"
	| "processing"
	| "completed"
	| "failed"
	| "reversed";

/** From the caller's own perspective — attached by list/findOne only. */
export type TransactionDirection = "incoming" | "outgoing";

/** How the money moved. `intent` = matched a funding intent (not used by
 * this app — see `apiRoutes.wallets`' own note on why); `stellar` = raw
 * on-chain send/receive; `peakline` = internal ledger transfer between
 * Peakline users; `bank` = fiat rail (GHS); `conversion` = FX. */
export type TransactionMethod = "intent" | "stellar" | "peakline" | "bank" | "conversion";

export interface TransactionCounterpartyData {
	id: string;
	name?: string | null;
	username?: string | null;
	phone?: string | null;
}

export interface TransactionBusinessData {
	id: string;
	name: string;
}

/** `GET /transactions`, `GET /transactions/{id}`. A generic wallet-ledger
 * record — no display title of its own (see `lib/transactions.ts`'s own
 * formatters, which derive one from `type`/`counterparty`/`direction`).
 * `counterparty` is only ever populated for internal Peakline-to-Peakline
 * transfers; an on-chain send/receive to a bare wallet address has
 * `externalAddress` instead and no `counterparty`. */
export interface TransactionData {
	id: string;
	userId: string;
	businessId?: string | null;
	business?: TransactionBusinessData | null;
	counterpartyId?: string | null;
	type: TransactionType;
	status: TransactionLedgerStatus;
	amount: string;
	currency: string;
	fee: string;
	fxRate?: string | null;
	toCurrency?: string | null;
	toAmount?: string | null;
	stellarTxHash?: string | null;
	externalAddress?: string | null;
	/** Free-form. The one key the app reads is `amountMismatch: "true"`,
	 * set on a deposit that settled against a payment link for a different
	 * amount than requested (see `hasAmountMismatch`). */
	metadata?: Record<string, unknown> | null;
	/** Human-readable reason; null unless `status` is `failed`. */
	failureReason?: string | null;
	/** The original transaction this one retried, if any. */
	retryOfId?: string | null;
	completedAt?: string | null;
	createdAt: string;
	updatedAt: string;
	direction?: TransactionDirection;
	method?: TransactionMethod;
	counterparty?: TransactionCounterpartyData | null;
}

/** `POST /auth/2fa/enroll` — shown once; the recovery codes can't be
 * fetched again after this response. */
export interface EnrollTotpData {
	/** Base64 data URL — render directly in an `<img>`. */
	qrCodeDataUrl: string;
	/** Raw otpauth:// URI, for manual entry when the app can't scan. */
	otpAuthUri: string;
	recoveryCodes: string[];
}

/** A single money-with-comparison figure — `totalReceived`/`totalSent`/
 * `todaysPayments`/`todaySent` on `MerchantDashboardStatsData`. `amount` is
 * a decimal string; `changePct` is `null` when the comparison baseline was
 * 0 (real, live-observed: a merchant with nothing sent yesterday but
 * something sent today has no percentage to show). `changeVsLabel` is a
 * snake_case label ("previous_month", "yesterday") describing what it's
 * compared against — not an enum the docs pin down, so treated as an
 * arbitrary string and humanized at render time rather than mapped 1:1.
 * `changePct` can also be negative (a real drop day-over-day/month-over-month)
 * — `ChangeIndicator` renders that as a down arrow, not a fake positive. */
export interface DashboardMoneyData {
	amount: string;
	currency: string;
	changePct: number | null;
	changeVsLabel: string;
}

export interface DashboardPendingData {
	amount: string;
	currency: string;
	count: number;
}

/** One point in the cash-flow chart — both directions per bucket now
 * (real response as of 2026-09-13; previously a single `value`, received-only). */
export interface DashboardBucketData {
	label: string;
	/** Payments received. */
	inflow: string;
	/** Withdrawals and transfers out, refunds excluded. */
	outflow: string;
	/** Completed refunds. */
	refunds: string;
}

export interface DashboardChartData {
	period: "year" | "month" | "week";
	currency: string;
	totalInflow: string;
	totalOutflow: string;
	totalRefunds: string;
	buckets: DashboardBucketData[];
}

/** `GET /merchant/dashboard/stats` — one call covers both Overview's stat
 * cards (`totalReceived`/`totalSent`/`todaysPayments`/`todaySent`/`pending`)
 * and the cash-flow chart (`chart`, shaped by the `period` query param); the
 * `period` param only changes `chart` — the other fields reflect the same
 * all-time/today/pending totals regardless of it. `totalSent`/`todaySent`
 * are real as of 2026-09-13 — money the merchant has paid out, alongside
 * the money it's received, so Overview shows both directions instead of
 * just inflow. */
export interface MerchantDashboardStatsData {
	totalReceived: DashboardMoneyData;
	totalSent: DashboardMoneyData;
	todaysPayments: DashboardMoneyData;
	todaySent: DashboardMoneyData;
	pending: DashboardPendingData;
	/** v3 additions (all-time). */
	refundsCompleted: DashboardMoneyData;
	/** Payments received minus completed refunds. */
	netCollections: DashboardMoneyData;
	/** Total USDC moved: received + sent. */
	usdcVolume: DashboardMoneyData;
	/** Unpaid customer requests: pending, processing or flagged. */
	outstandingRequests: DashboardPendingData;
	/** Settled (paid) customer requests. */
	completedCollections: DashboardPendingData;
	/** Refunds that are requested, authorized or processing. */
	pendingRefunds: DashboardPendingData;
	chart: DashboardChartData;
}

/** `reconciliationStatus` (v3 API). `flagged`/`amount_mismatch` = open
 * review flag, `reviewed` = resolved flag, `pending` = refund in flight. */
export type ReconciliationStatus =
	| "matched"
	| "unmatched"
	| "flagged"
	| "amount_mismatch"
	| "failed"
	| "pending"
	| "reviewed";

export type ReconciliationTransactionType = "payment" | "refund" | "unmatched_payment";

/** `GET /merchant/reconciliation`, `GET /merchant/reconciliation/{reference}`
 * (v3 shape). One record per payment, refund, or never-credited flagged
 * payment. */
export interface ReconciliationData {
	/** Payment transaction id, refund id, or flag id (unmatched_payment). */
	reference: string;
	transactionType: ReconciliationTransactionType;
	businessId: string;
	/** Payment request / link this payment settles. */
	paymentRequestId?: string | null;
	/** Merchant-visible reference of that request (PK-...). */
	paymentReference?: string | null;
	customerReference?: string | null;
	customerName?: string | null;
	customerEmail?: string | null;
	amount: string;
	asset: string;
	/** Ledger status of a payment. Null for refunds and uncredited payments. */
	paymentStatus?: TransactionLedgerStatus | null;
	/** Payment: pending | partially_refunded | refunded. Refund: its own status. */
	refundStatus?: string | null;
	stellarTxHash?: string | null;
	/** Payer address (payments) or recipient address (refunds). */
	counterpartyAddress?: string | null;
	/** Completion time, or creation time while not completed. */
	transactionDate: string;
	reconciliationStatus: ReconciliationStatus;
}

export interface ReconciliationSummaryData {
	matched: number;
	unmatched: number;
	flagged: number;
	amountMismatch: number;
	failed: number;
	pending: number;
	reviewed: number;
	total: number;
}

export interface ReconciliationQuery {
	status?: ReconciliationStatus;
	type?: ReconciliationTransactionType;
	q?: string;
	from?: string;
	to?: string;
}

/** `GET /payment-links/flags` — a payment that could not be matched cleanly
 * (wrong amount/asset, missing memo, late, duplicate, cancelled request). */
export interface ReconciliationFlagData {
	id: string;
	businessId: string;
	paymentLinkId?: string | null;
	reason: string;
	stellarTxHash: string;
	amount: string;
	assetCode?: string | null;
	fromAddress?: string | null;
	/** Set when the payment was credited despite the flag. */
	transactionId?: string | null;
	resolvedAt?: string | null;
	note?: string | null;
	createdAt: string;
}

export interface PaymentLinkBusinessData {
	id: string;
	name: string;
}

/** v3 lifecycle (reusable links and customer requests share it). `expired`
 * also covers pending requests past their deadline. `active` is accepted by
 * the API as a legacy filter alias for `pending` but never returned. */
export type PaymentLinkStatus = "pending" | "processing" | "paid" | "expired" | "cancelled" | "flagged";

/** `link` = reusable by many payers; `request` = single-use, customer-specific
 * (created by setting any customer field). */
export type PaymentLinkKind = "link" | "request";

/** `POST/GET /payment-links`, `GET /payment-links/{id}`,
 * `POST /payment-links/{id}/cancel`. Customer payment requests are the same
 * resource with `kind: "request"`. */
export interface PaymentLinkData {
	id: string;
	/** Unique per business, e.g. "PK-1A2B3C4D". */
	reference: string;
	kind: PaymentLinkKind;
	title: string;
	/** Decimal string, e.g. "500.00". */
	amount: string;
	currency: "USDC";
	description?: string | null;
	customerReference?: string | null;
	customerName?: string | null;
	customerEmail?: string | null;
	customerPhone?: string | null;
	/** Due date / deadline. */
	expiresAt: string;
	cancelledAt?: string | null;
	paidAt?: string | null;
	status: PaymentLinkStatus;
	/** The URL slug and the Stellar text memo a payer must attach. */
	publicCode: string;
	/** Full shareable URL, ready to use as-is. */
	url: string;
	business: PaymentLinkBusinessData;
	createdAt: string;
	updatedAt: string;
}

/** `GET /payment-links/stats` — counts across links and requests. */
export interface PaymentLinkStatsData {
	total: number;
	pending: number;
	/** Legacy alias of `pending`. */
	active: number;
	processing: number;
	paid: number;
	expired: number;
	cancelled: number;
	flagged: number;
}

export interface AmountCountData {
	/** Decimal string. */
	amount: string;
	count: number;
}

/** `GET /payment-links/collections` — customer requests only. */
export interface CollectionsOverviewData {
	/** pending (not past due), processing or flagged. */
	outstanding: AmountCountData;
	completed: AmountCountData;
	expired: AmountCountData;
	cancelled: AmountCountData;
}

/** `GET /payment-links/{id}/payments` — on-chain payments attributed to a
 * link. `processing` = reported and verified, awaiting credit. */
export interface PaymentLinkPaymentData {
	id: string;
	status: "processing" | "matched";
	stellarTxHash: string;
	amount: string;
	fromAddress?: string | null;
	paidAtChain?: string | null;
	transactionId?: string | null;
	createdAt: string;
}

/** `GET /pay/{code}` — public, no auth. Everything a payer needs to
 * complete payment themselves (destination wallet + the memo that must
 * accompany the Stellar transfer for it to be matched to this link). */
export interface PublicPaymentLinkData {
	/** Optional only because `/pay` synthesizes this shape for person
	 * payments too (see `buildPersonPayTarget`). */
	reference?: string;
	title: string;
	amount: string;
	currency: "USDC";
	description?: string | null;
	expiresAt: string;
	status: PaymentLinkStatus;
	businessName: string;
	destinationAddress: string;
	memo: string;
	/** SEP-7 payment URI wallets can open. */
	paymentUri?: string;
	/** Not part of the real `GET /pay/{code}` response (always a business
	 * there). Set only when `/pay` synthesizes this shape for a *person*
	 * payment (see `buildPersonPayTarget`). */
	recipientRoleLabel?: string;
	/** Not part of the response either — the code it was looked up by,
	 * attached by `usePaymentLinkLookup` for the claim endpoints. */
	publicCode?: string;
}

export type PaymentLinkClaimStatus = "pending" | "settled" | "failed";

/** `PaymentLinkClaimDto` — returned by both external-wallet endpoints
 * (confirmed against /docs-json):
 *  - `POST /pay/{code}/claim` (body `{ fromAddress }`) → a `pending` claim;
 *    its `id` is the claimId the verify step needs.
 *  - `POST /pay/{code}/claim/{claimId}/verify` (body `{ txHash }`) → the
 *    backend checks Horizon (tx succeeded, USDC from the right issuer,
 *    sender = `fromAddress`, recipient = the merchant's wallet, hash not
 *    already credited) and returns the claim `settled`.
 * Any failed check is a 400 (and that claim can't be retried — create a
 * new one); 409 = already settled / hash already credited. A wrong
 * *amount* is NOT a failure: it still settles, flagged
 * `metadata.amountMismatch` on the merchant's deposit for reconciliation.
 * The claim carries no amount, so the payer side can't see that flag. */
export interface PaymentLinkClaimData {
	id: string;
	paymentLinkId: string;
	fromAddress: string;
	txHash: string | null;
	status: PaymentLinkClaimStatus;
	failureReason?: string | null;
	createdAt: string;
	updatedAt: string;
}

/** `internal` = pure ledger transfer between Peakline users, settled
 * instantly with no on-chain fee. `external` = an on-chain Stellar send to
 * a non-Peakline address. */
export type TransferType = "internal" | "external";

/** `POST /transfers/send`'s own response — a synchronous result, not a
 * "queued" one (no `status` field here, unlike `TransferStatusData`). */
export interface SendMoneyResponseData {
	transactionId: string;
	/** `processing` = Stellar outcome not known yet (e.g. a timeout). Recheck
	 * with `POST /transfers/{id}/recheck` instead of sending again. */
	status: "processing" | "completed" | "failed";
	type: TransferType;
	amount: string;
	currency: string;
	/** Null for internal transfers. */
	stellarTxHash?: string | null;
	/** Whichever identifier (username/phone/truncated wallet address) was
	 * used to resolve the recipient — there's no directory lookup that
	 * returns an actual name. */
	recipientLabel: string;
}

export type TransferStatus = "pending" | "processing" | "completed" | "failed" | "reversed";

export interface TransferRecipientData {
	name?: string | null;
	phone?: string | null;
	username?: string | null;
	walletAddress?: string | null;
}

/** `GET /transfers/{id}` — not wired to any UI yet; nothing currently shows
 * a transfer's detail-by-id (same gap as `transactions.byId`, which this
 * would need reconciling with — a real ledger record, not the app's own
 * named-counterparty `Transaction` shape). */
export interface TransferStatusData {
	transactionId: string;
	status: TransferStatus;
	type: TransferType;
	amount: string;
	currency: string;
	fee: string;
	fxEquivalent?: string | null;
	stellarTxHash?: string | null;
	/** Why the transfer failed. Null otherwise. */
	failureReason?: string | null;
	recipient: TransferRecipientData;
	newBalance: string;
	newBalanceFxEquivalent?: string | null;
	note?: string | null;
	createdAt: string;
	completedAt?: string | null;
}

/** `POST /transfers/preview` — what the user confirms before signing.
 * Nothing is signed or debited. */
export interface TransferPreviewData {
	type: TransferType;
	amount: string;
	asset: string;
	/** Stellar network, for external transfers. */
	network?: "testnet" | "mainnet" | null;
	/** Username, phone, or full Stellar address. */
	recipient: string;
	/** On-chain sends pay a small XLM fee; internal transfers are free. */
	fee: { amount: string; currency: "XLM" | "USDC" };
	/** USDC balance after this transfer. */
	balanceAfter: string;
	canSend: boolean;
	/** Why sending would fail (empty when `canSend`). */
	issues: string[];
}

/* ---- Third tranche: refunds & reporting (v3 API) ---- */

export type RefundStatus = "requested" | "authorized" | "processing" | "completed" | "failed";

export interface RefundableBalanceData {
	paymentAmount: string;
	/** Sum of completed refunds. */
	refunded: string;
	/** Sum of refunds still requested/authorized/processing (reserved). */
	pending: string;
	remaining: string;
}

/** `GET /refunds/eligible-payments` — completed payments with a sender
 * address and something left to refund. */
export interface EligiblePaymentData {
	transactionId: string;
	businessId: string;
	amount: string;
	/** Refunds go back here. */
	payerAddress: string;
	stellarTxHash?: string | null;
	paymentLinkId?: string | null;
	reference?: string | null;
	customerReference?: string | null;
	completedAt?: string | null;
	refundable: RefundableBalanceData;
}

/** `POST /refunds`, `GET /refunds`, `GET /refunds/{id}`, and the
 * authorize/execute/cancel actions. */
export interface RefundData {
	id: string;
	businessId: string;
	originalTransactionId: string;
	amount: string;
	currency: string;
	reason: string;
	/** Original payer address. */
	recipientAddress: string;
	status: RefundStatus;
	stellarTxHash?: string | null;
	failureReason?: string | null;
	ledgerTransactionId?: string | null;
	authorizedAt?: string | null;
	completedAt?: string | null;
	createdAt: string;
	updatedAt: string;
	/** Present on detail responses. */
	refundable?: RefundableBalanceData | null;
}

export interface CreateRefundPayload {
	originalTransactionId: string;
	amount: string;
	reason: string;
	/** 8-100 chars; resubmitting the same key returns the same refund. */
	idempotencyKey: string;
}

/** `GET /merchant/reports/summary` (default range: last 30 days). */
export interface MerchantReportData {
	from: string;
	to: string;
	currency: string;
	paymentsReceived: AmountCountData;
	refundsCompleted: AmountCountData;
	netCollections: string;
	/** Right now, not range-bound. */
	outstandingRequests: AmountCountData;
	completedCollections: AmountCountData;
	/** Right now, not range-bound. */
	pendingRefunds: AmountCountData;
	flaggedPayments: number;
	unmatchedPayments: number;
}

/** `GET /merchant/reports/activity`. */
export interface ActivityBucketData {
	/** Start of the day, week (Monday) or month, UTC. */
	periodStart: string;
	payments: AmountCountData;
	refunds: AmountCountData;
	net: string;
}

export type PaymentMethodKind = "payment_request" | "payment_link" | "funding_intent" | "direct_stellar";

/** `GET /merchant/reports/payment-methods`. */
export interface PaymentMethodBreakdownData {
	method: PaymentMethodKind;
	count: number;
	amount: string;
}

/** `GET /merchant/reports/customers` — per-customer request history. */
export interface CustomerCollectionData {
	customerName?: string | null;
	customerEmail?: string | null;
	requests: number;
	paidRequests: number;
	paidAmount: string;
	outstandingAmount: string;
	lastRequestAt?: string | null;
}
