/**
 * Response shapes for the backend's `/docs-json` DTOs (NestJS/Swagger,
 * `https://peak.usepeakline.com/docs`) — auth + the Admin surface this app
 * actually calls, added as each phase needs them rather than mirrored in
 * full up front. Request payload shapes are typed inline where they're
 * built, matching apps/web's own convention.
 */

/** Every successful response's envelope shape. */
export interface ApiSuccessResponse<T = unknown> {
	statusCode: number;
	message: string;
	timestamp: string;
	data: T;
}

/** A NestJS default-exception-filter error body — `message` can be a single
 * string or (from class-validator) an array of them; `code` is only present
 * on some errors. Same shape apps/web already confirmed live. */
export interface ApiErrorResponse {
	statusCode: number;
	error?: string;
	message?: string | string[];
	code?: string;
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
}

/** `/auth/login` returns this instead of `AuthTokensData` when the account
 * has 2FA enabled — confirmed against the real spec's own description of
 * `VerifyMfaDto.mfaToken` ("Short-lived MFA token returned from login"),
 * even though the endpoint's documented 200 schema only shows
 * `AuthTokensDto`. Distinguish the two by whether `accessToken` is present. */
export interface MfaRequiredData {
	mfaToken: string;
}

export type LoginResponseData = AuthTokensData | MfaRequiredData;

export function isMfaRequired(data: LoginResponseData): data is MfaRequiredData {
	return !("accessToken" in data);
}

/** `staffRole` is only ever populated for `role: "staff"` accounts — the
 * only kind of account this app should ever let in (see `useStaffGate`). */
export type StaffRole = "admin" | "super_admin" | "support" | "compliance" | "operations";

/** Trimmed to the fields `useStaffGate` actually reads — see `AdminUserData`
 * below (Phase 1's Users screen) for the full `AdminUserDto`. */
export interface AdminSelfData {
	id: string;
	firstName: string;
	lastName: string;
	email: string;
	role: "staff" | "customer";
	staffRole: StaffRole | null;
}

export type CustomerType = "individual" | "merchant";

/** `GET /admin/users` / `GET /admin/users/{id}` — confirmed live against
 * `/docs-json`. Every timestamp field is nullable — `null` reads as "never
 * happened" (never locked, never deleted, never verified), not "unknown". */
export interface AdminUserData {
	id: string;
	firstName: string;
	lastName: string;
	otherName: string | null;
	email: string;
	phoneNumber: string;
	countryCode: string;
	username: string | null;
	avatarUrl: string | null;
	role: "staff" | "customer";
	staffRole: StaffRole | null;
	customerType: CustomerType | null;
	kycTier: number;
	emailVerifiedAt: string | null;
	phoneVerifiedAt: string | null;
	kycVerifiedAt: string | null;
	suspendedAt: string | null;
	suspendedReason: string | null;
	deletionRequestedAt: string | null;
	deletedAt: string | null;
	pinAttempts: number | null;
	pinLockedUntil: string | null;
	loginAttempts: number | null;
	lockedAt: string | null;
	lockedUntil: string | null;
	lastLoginAt: string | null;
	lastLoginIp: string | null;
	createdAt: string;
	updatedAt: string;
}

export interface AdminUsersQuery {
	q?: string;
	role?: "staff" | "customer";
	customerType?: CustomerType;
	kycTier?: number;
	isLocked?: 0 | 1;
	from?: string;
	to?: string;
	order?: "asc" | "desc";
}

/** `GET /admin/businesses` / `GET /admin/businesses/{id}` — the response
 * schema names this `BusinessDto` (not `AdminBusinessDto`), confirmed live —
 * same shape apps/web's own `BusinessData` carries, since it's the same
 * underlying record; this app just isn't scoped to "mine" like that one is. */
export interface AdminBusinessData {
	id: string;
	ownerId: string;
	name: string;
	category: string;
	status: "active" | "suspended" | "pending_verification";
	country: string;
	city: string | null;
	address: string | null;
	phone: string | null;
	website: string | null;
	logoUrl: string | null;
	description: string | null;
	registrationNumber: string | null;
	taxId: string | null;
	verifiedAt: string | null;
	createdAt: string;
	updatedAt: string;
}

export interface AdminBusinessesQuery {
	q?: string;
	status?: AdminBusinessData["status"];
	ownerId?: string;
	from?: string;
	to?: string;
}

export type TransactionType =
	| "deposit"
	| "withdrawal"
	| "internal_transfer"
	| "conversion"
	| "withdrawal_ghs";
export type TransactionLedgerStatus = "pending" | "processing" | "completed" | "failed" | "reversed";
export type TransactionDirection = "incoming" | "outgoing";

/** `GET /admin/transactions` / `GET /admin/transactions/{id}` — the real
 * spec's response schema for both is a documentation bug on the backend's
 * side (`{id}` resolves to a bare `nullable: true` with no ref at all, and
 * the list resolves to `AdminReverseTransactionDto` — a `{ reason: string }`
 * request body, clearly not a transaction). Modeled here on apps/web's own
 * confirmed `TransactionData` instead, since this is almost certainly the
 * same underlying ledger entity just unscoped from "my own account" — but
 * unverified against a real response. `AdminTransactionDetail`'s own render
 * stays defensive (optional chaining, a raw-JSON fallback) rather than
 * trusting this shape completely. */
export interface AdminTransactionData {
	id: string;
	userId: string;
	businessId?: string | null;
	type: TransactionType;
	status: TransactionLedgerStatus;
	amount: string;
	currency: string;
	fee?: string;
	fxRate?: string | null;
	toCurrency?: string | null;
	toAmount?: string | null;
	stellarTxHash?: string | null;
	externalAddress?: string | null;
	metadata?: Record<string, unknown> | null;
	completedAt?: string | null;
	createdAt: string;
	updatedAt?: string;
	direction?: TransactionDirection;
}

export interface AdminTransactionsQuery {
	q?: string;
	userId?: string;
	businessId?: string;
	type?: TransactionType;
	status?: TransactionLedgerStatus;
	currency?: "USDC" | "GHS";
	direction?: TransactionDirection;
	from?: string;
	to?: string;
	order?: "asc" | "desc";
}

/** `GET /admin/audit-log` / `GET /admin/audit-log/{id}` — same documentation
 * bug as transactions above (`{id}` is a bare `nullable: true`; the list
 * resolves to `AdminListAuditLogsQueryDto`, the *query params'* own DTO, not
 * a response item). Modeled defensively on the query params' own field
 * names (`actorId`/`action`/`resourceType`/`resourceId`) plus the timestamp
 * every audit trail needs — unverified against a real response, same
 * caveat as `AdminTransactionData`. */
export interface AdminAuditLogEntryData {
	id: string;
	actorId: string;
	actorEmail?: string | null;
	action: string;
	resourceType: string;
	resourceId: string | null;
	metadata?: Record<string, unknown> | null;
	createdAt: string;
}

export interface AdminAuditLogQuery {
	actorId?: string;
	action?: string;
	resourceType?: string;
	resourceId?: string;
	from?: string;
	to?: string;
}

export interface PaginationMeta {
	totalCount: number;
	pageCount: number;
	currentPage: number;
	limit: number;
	prevPage: boolean;
	nextPage: boolean;
}

export interface PaginatedResponse<T> {
	statusCode: number;
	message: string;
	timestamp: string;
	data: T[];
	meta: PaginationMeta;
}

/** `GET /admin/analytics/overview` — platform-wide totals for the dashboard
 * home. Amount fields are decimal strings (ledger precision), not numbers —
 * parse with `Number()` before formatting, same convention as apps/web's
 * own `BalanceData`. */
export interface AdminOverviewData {
	totalUsers: number;
	totalMerchants: number;
	totalDeposits: string;
	totalWithdrawals: string;
	totalInternalTransfers: string;
	totalVolume: string;
	activePaymentLinks: number;
	pendingFundingIntents: number;
	totalFeeIncome: string;
}

// ---------------------------------------------------------------------
// Phase 2 — user & business moderation actions
// ---------------------------------------------------------------------

/** `PATCH /admin/users/{id}/lock` request body — confirmed live. */
export interface AdminLockUserPayload {
	reason: string;
}

/** `PATCH /admin/users/{id}/kyc-tier` — confirmed live. */
export interface AdminSetKycTierPayload {
	tier: 0 | 1 | 2 | 3;
	reason?: string;
}

/** `PATCH /admin/users/{id}/role` (super_admin only) — confirmed live.
 * `staffRole` only makes sense (and is presumably required by the backend)
 * when `role: "staff"`; omitted when demoting back to `"customer"`. */
export interface AdminSetRolePayload {
	role: "staff" | "customer";
	staffRole?: StaffRole;
	reason: string;
}

/** `GET /admin/users/{id}/sessions` — confirmed live. `revokedAt: null`
 * means still active. */
export interface AdminUserSessionData {
	id: string;
	userId: string;
	revokedAt: string | null;
	expiresAt: string;
	createdAt: string;
}

/** `GET /admin/users/{id}/2fa` — confirmed live. */
export interface AdminUser2faStatusData {
	enabled: boolean;
	verifiedAt: string | null;
	createdAt: string | null;
}

/** `GET /admin/businesses/{id}/status-history` — confirmed live.
 * `fromStatus` is nullable (the business's very first status event has
 * nothing to transition *from*). */
export interface BusinessStatusEventData {
	id: string;
	businessId: string;
	fromStatus: AdminBusinessData["status"] | null;
	toStatus: AdminBusinessData["status"];
	changedBy: string;
	reason: string | null;
	createdAt: string;
}

/** `GET /admin/businesses/{id}/wallets` — real response schema is another
 * of the same documentation bugs (`nullable: true`, no ref) as transactions/
 * audit-log above. Modeled on the confirmed `AdminWalletDto` (the same
 * shape `GET /admin/wallets/{id}` returns) since this is almost certainly
 * that same entity, just pre-filtered to one business — unverified. */
export interface AdminBusinessWalletData {
	id: string;
	userId?: string | null;
	businessId?: string | null;
	walletType: "individual" | "merchant";
	network: "mainnet" | "testnet";
	publicKey: string;
	label?: string | null;
	deactivatedAt?: string | null;
	createdAt: string;
}

/** `GET /admin/businesses/{id}/payment-links` — same documentation bug
 * (resolves to `BusinessDto`, clearly wrong). Modeled on apps/web's own
 * confirmed `PaymentLinkData`, minus the nested `business` object (already
 * scoped to one business here) — unverified. */
export interface AdminBusinessPaymentLinkData {
	id: string;
	title: string;
	amount: string;
	currency: "USDC";
	status: "active" | "expired" | "cancelled";
	publicCode: string;
	url: string;
	expiresAt: string;
	cancelledAt?: string | null;
	createdAt: string;
}

// ---------------------------------------------------------------------
// Phase 3 — wallets & ledger ops
// ---------------------------------------------------------------------

/** `GET /admin/wallets`, `GET /admin/wallets/{id}` — confirmed live
 * (correctly-referenced `AdminWalletDto` both places, unlike most of this
 * phase). */
export interface AdminWalletData {
	id: string;
	userId: string;
	businessId?: string | null;
	walletType: "individual" | "merchant";
	network: "mainnet" | "testnet";
	publicKey: string;
	label?: string | null;
	federationAddress?: string | null;
	deactivatedAt?: string | null;
	createdAt: string;
	updatedAt: string;
}

export interface AdminWalletsQuery {
	userId?: string;
	businessId?: string;
	walletType?: "individual" | "merchant";
	network?: "mainnet" | "testnet";
	isDeactivated?: 0 | 1;
}

/** `PATCH /admin/wallets/{id}/deactivate` body — confirmed live (reason
 * required). Reactivate (super_admin only) takes no body at all. */
export interface AdminWalletActionPayload {
	reason: string;
}

/** `GET /admin/wallets/{id}/funding-intents` — another of this phase's
 * documentation bugs (resolves to `AdminWalletDto[]`, clearly wrong — a
 * funding intent isn't a wallet). Modeled on the real, correctly-documented
 * customer-facing `FundingIntentDto` (`POST/GET /wallets/stellar/fund/
 * intent`) instead, since this is almost certainly the same entity, just
 * listed admin-side across everyone's intents for one wallet — unverified
 * against a real admin response. */
export interface AdminFundingIntentData {
	id: string;
	memo: string;
	destinationAddress: string;
	expectedAmount: string;
	asset: string;
	status: "pending" | "completed" | "expired" | "failed";
	stellarTxHash?: string | null;
	transactionId?: string | null;
	expiresAt: string;
	completedAt?: string | null;
	createdAt: string;
}

export interface AdminFundingIntentsQuery {
	status?: AdminFundingIntentData["status"];
	from?: string;
	to?: string;
}

/** `PATCH /admin/transactions/{id}/reverse` / `.../status` — both
 * confirmed live with `reason` present but NOT in either DTO's own
 * `required` array, unlike most other reason-bearing actions in this app —
 * genuinely optional on both. */
export interface AdminReasonOptionalPayload {
	reason?: string;
}

/**
 * The Ledger group (`GET /admin/ledger/accounts`, `.../accounts/{id}`,
 * `.../system-accounts`, `.../balances`) has no confirmed response schema
 * at all — every one of these resolves to either a bare `null` or the
 * wrong (query-param) DTO in the real spec, and unlike Phase 1/2's own
 * documentation bugs, there's no customer-facing sibling endpoint to model
 * these on either (ledger internals are never exposed to a customer).
 * Rather than invent specific fields with confident-looking labels that
 * may not match reality, every Ledger screen renders whatever comes back
 * as a generic key/value or column view (see `components/data/Dynamic*`) —
 * genuinely unknown shape, typed `unknown` end to end on purpose.
 */
export type UnknownRecord = Record<string, unknown>;

// ---------------------------------------------------------------------
// Phase 4 — Payment Links, Config, Staff
// ---------------------------------------------------------------------

/** `GET /admin/payment-links`, `.../{id}` — confirmed live, and it turned
 * out genuinely different from the shape this was first (wrongly) modeled
 * on apps/web's own customer-facing `PaymentLinkData`: no `status`, no
 * `url`, and `business` is not a nested object — it's a raw `businessId`
 * on both endpoints, plus a flat `businessName` string but ONLY on the
 * `{id}` detail response, not the list. There's no server-computed status
 * at all — derive it client-side from `cancelledAt`/`expiresAt` (see
 * `derivePaymentLinkStatus`) rather than expect a field that was never
 * actually there; the original doc-bug caveat (list resolves to the wrong,
 * query-param DTO) turned out to under-sell it — even the customer-facing
 * sibling was the wrong model to copy from, not just an unconfirmed one. */
export interface AdminPaymentLinkData {
	id: string;
	ownerId: string;
	businessId: string;
	/** Only present on `GET /admin/payment-links/{id}` — `undefined` on
	 * list rows, which have no business name at all, just the id. */
	businessName?: string;
	title: string;
	amount: string;
	currency: "USDC";
	description?: string | null;
	customerReference?: string | null;
	publicCode: string;
	expiresAt: string;
	cancelledAt?: string | null;
	createdAt: string;
	updatedAt: string;
}

export type AdminPaymentLinkStatus = "active" | "expired" | "cancelled";

/** No server-computed status field exists on either payment-links response
 * (confirmed live) — a link's real status is always a function of exactly
 * these two timestamps, the same rule apps/web's own backend presumably
 * applies before it ever hands a customer a `status` string. */
export function derivePaymentLinkStatus(link: {
	cancelledAt?: string | null;
	expiresAt: string;
}): AdminPaymentLinkStatus {
	if (link.cancelledAt) return "cancelled";
	return new Date(link.expiresAt).getTime() < Date.now() ? "expired" : "active";
}

export interface AdminPaymentLinksQuery {
	q?: string;
	businessId?: string;
	ownerId?: string;
	status?: AdminPaymentLinkStatus;
	from?: string;
	to?: string;
}

/** `PATCH /admin/payment-links/{id}/cancel` body — `reason` is a real field
 * on `AdminCancelPaymentLinkDto` but, confirmed live, not in its `required`
 * array — same "optional despite being the whole point of the dialog"
 * shape Phase 2/3 already found on verify/reactivate/reverse. */
export interface AdminCancelPaymentLinkPayload {
	reason?: string;
}

/** `GET /admin/config` — confirmed live (`AdminConfigKeyDto`). Lists every
 * key WITHOUT its value — the value is only ever fetched one key at a time,
 * on demand, via `AdminConfigValueData` below (see that type's own note on
 * why). `updatedBy` is untyped on the real DTO (`type: "object"` with no
 * further shape given) — likely a user id or a nested actor object, but not
 * confirmed either way, so kept as `unknown` rather than guessed. */
export interface AdminConfigKeyData {
	key: string;
	updatedBy?: unknown;
	createdAt: string;
	updatedAt: string;
}

/** `GET /admin/config/{key}` — confirmed live (`AdminConfigValueDto`),
 * super_admin only. Config values are stored encrypted; this endpoint
 * decrypts on the fly, so the UI treats fetching one as a deliberate
 * "reveal" action per key (a button, not something that loads with the
 * list) rather than something to prefetch for every row. */
export interface AdminConfigValueData extends AdminConfigKeyData {
	value: string;
}

/** `PUT /admin/config/{key}` body — confirmed live, super_admin only.
 * Also used to CREATE a key that doesn't exist yet — the same endpoint
 * doubles as create-or-update per its own summary ("Create or update a
 * config key"), so there's no separate "new key" form, just this typed
 * with whatever key string the admin enters. */
export interface AdminSetConfigPayload {
	value: string;
}

/** `GET /admin/staff` reuses the same `AdminUserDto` Phase 1's Users
 * screen already types as `AdminUserData` — confirmed live — just
 * pre-filtered server-side to `role: "staff"` accounts. No `q` free-text
 * search on this endpoint (unlike Users), only the `staffRole` filter. */
export interface AdminStaffQuery {
	staffRole?: StaffRole;
}

/** `POST /admin/staff/invite` body — confirmed live. No documented example
 * on this DTO's own `phoneNumber`/`countryCode` fields, but the closest
 * real sibling that creates an account from scratch (`RegisterDto`, the
 * customer sign-up) documents E.164 phone ("+233241234567") + ISO
 * 3166-1 alpha-2 `countryCode` ("GH") — assumed here too rather than
 * guessed from nothing, same "model on a confirmed sibling" approach
 * Phase 1-3's own documentation gaps used. */
export interface AdminInviteStaffPayload {
	email: string;
	firstName: string;
	lastName: string;
	phoneNumber: string;
	countryCode: string;
	staffRole: StaffRole;
}

/** `POST /admin/staff/invite` response — confirmed live. Carries a
 * server-generated `temporaryPassword` in plaintext, once, in this one
 * response — never shown again after this dialog closes (nothing re-fetches
 * or persists it client-side), same "shown once, on your own head to save
 * it" pattern as e.g. 2FA recovery codes. */
export interface AdminInviteStaffResponseData {
	id: string;
	email: string;
	firstName: string;
	lastName: string;
	staffRole: StaffRole;
	temporaryPassword: string;
	createdAt: string;
}

/** `PATCH /admin/staff/{id}/role` body — confirmed live. */
export interface AdminChangeStaffRolePayload {
	staffRole: StaffRole;
}
