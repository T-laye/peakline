/**
 * Real backend paths, forwarded verbatim by the same-origin proxy
 * (`src/app/api/proxy/[...path]/route.ts`), so these already include the
 * `/api/v1` prefix the actual API expects.
 */
export const apiRoutes = {
	health: "/api/v1/health",

	auth: {
		REGISTER: "/api/v1/auth/register",
		LOGIN: "/api/v1/auth/login",
		REFRESH: "/api/v1/auth/refresh",
		VERIFY_EMAIL: "/api/v1/auth/verify-email",
		RESEND_OTP: "/api/v1/auth/resend-otp",
		CUSTOMER_TYPE: "/api/v1/auth/customer-type",
		LOGOUT: "/api/v1/auth/logout",
		LOGOUT_ALL: "/api/v1/auth/logout-all",
		// Real as of this writing — confirmed live against /docs-json.
		// forgot-password/reset-password (the logged-out flow) exist too but
		// are a separate, already-built form elsewhere (ForgotPasswordForm/
		// ResetPasswordForm) not yet wired to them; out of scope here.
		CHANGE_PASSWORD: "/api/v1/auth/change-password",
	},

	// TOTP (authenticator-app) 2FA — account-settings enroll/confirm/disable
	// are wired to these (see features/profile/hooks); VERIFY/RECOVER are the
	// login-flow's own counterparts, not yet wired (the sign-in 2FA screens
	// still predate this endpoint group — a method-picker with an email
	// option this backend has no equivalent for, so that flow needs its own
	// pass rather than a drop-in swap).
	twoFactor: {
		ENROLL: "/api/v1/auth/2fa/enroll",
		CONFIRM: "/api/v1/auth/2fa/confirm",
		DISABLE: "/api/v1/auth/2fa",
		VERIFY: "/api/v1/auth/2fa/verify",
		RECOVER: "/api/v1/auth/2fa/recover",
	},

	// Personal Information's real counterpart. `INDIVIDUAL` technically
	// "serves both individual and merchant account types" per its own docs
	// (just dateOfBirth/nationality/residentialAddress/city), but a merchant
	// account uses `MERCHANT` instead — one atomic call that sets
	// `customerType=merchant`, saves those same personal fields, AND
	// registers the business, idempotent on (ownerId, businessName). See
	// `useCompleteSignUp`'s own note for why that matters over the old
	// two-call (INDIVIDUAL then `POST /businesses`) approach. Each GET is
	// there for "review before submission" but isn't used yet — Review
	// already has the values from the form itself; `useCompleteSignUp` does
	// use `MERCHANT`'s GET, but only as a post-submit follow-up to recover
	// the new business's id (see there).
	onboarding: {
		INDIVIDUAL: "/api/v1/onboarding/individual",
		MERCHANT: "/api/v1/onboarding/merchant",
	},

	users: {
		ME: "/api/v1/users/me",
		ME_DELETION_REQUEST: "/api/v1/users/me/deletion-request",
		PIN: "/api/v1/users/pin",
		PIN_CONFIRM: "/api/v1/users/pin/confirm",
		// `multipart/form-data`, field `file` — image/jpeg or image/png, max
		// 5MB (confirmed live). Response is `data: null` despite the
		// endpoint's own description mentioning a returned `avatarUrl` — same
		// "description says one thing, schema says null" gap seen elsewhere
		// this session, so `useUpdateAvatar` refetches the profile instead of
		// trusting this response body.
		AVATAR: "/api/v1/users/me/avatar",
	},

	wallets: {
		STELLAR: "/api/v1/wallets/stellar",
		// Personal wallet + every business wallet you own (merchant) — was
		// briefly how a merchant's own business wallet was found (matching
		// on `business.id`), since there's no `GET /businesses/{id}/wallet`.
		// Not called anywhere right now — reverted to `STELLAR` alone for
		// every account type on request, no wallet listing for now (see
		// `useMyWallet`'s own note). Kept defined in case listing comes back.
		LIST: "/api/v1/wallets/stellar/list",
		// Testnet faucet — sends free test USDC straight to any address, no
		// real funding source involved. This, not the intent flow below, is
		// what Fund Wallet actually uses.
		FUND: "/api/v1/wallets/stellar/fund",
		FUND_QUOTE: "/api/v1/wallets/stellar/fund/quote",
		// Confirmed live — resolves a user id to `{name, publicKey}` for the
		// receive-via-QR/link flow (`useWalletLookup`), no balance/key
		// material included.
		lookupByUserId: (userId: string) => `/api/v1/wallets/lookup/${userId}`,
		// Confirmed live — `?phone=&countryCode=` (exact) or `?name=` (prefix
		// search), never both. See `useWalletSearch`'s own note on the two
		// very different `countryCode` conventions between this and
		// `SendMoneyDto`.
		SEARCH: "/api/v1/wallets/search",
		// `fund/intent` + `fund/intent/{id}` (announce you're about to send
		// USDC from an external wallet, then poll until it's matched) exist
		// on the backend but aren't wired here — nothing in this app can
		// actually act as that external sender (no external-wallet
		// integration), so building the UI for it would be a dead end with
		// no way to ever reach "completed".
	},

	merchant: {
		DASHBOARD_STATS: "/api/v1/merchant/dashboard/stats",
	},

	transfers: {
		SEND: "/api/v1/transfers/send",
		// Not wired yet — `POST /transfers/send`'s own response already
		// carries what the Send flow's Success step needs (transactionId,
		// type, amount, stellarTxHash, recipientLabel); nothing currently
		// looks up a transfer by id (same "generic ledger record has no UI
		// of its own yet" gap as `transactions.byId`).
		byId: (id: string) => `/api/v1/transfers/${id}`,
	},

	paymentLinks: {
		BASE: "/api/v1/payment-links",
		STATS: "/api/v1/payment-links/stats",
		EXPORT_CSV: "/api/v1/payment-links/export.csv",
		byId: (id: string) => `/api/v1/payment-links/${id}`,
		byIdCancel: (id: string) => `/api/v1/payment-links/${id}/cancel`,
	},

	// Public — no auth, used by whoever is *paying* a link, not the
	// merchant managing it.
	pay: {
		byCode: (code: string) => `/api/v1/pay/${code}`,
	},

	// Merchant-only. `verify`/`suspend`/`reactivate`/`status-history` are
	// admin/staff-only (no admin app exists per CLAUDE.md) — not called from
	// here.
	businesses: {
		BASE: "/api/v1/businesses",
		byId: (id: string) => `/api/v1/businesses/${id}`,
		// Provisions the business's own wallet — no GET counterpart. Not
		// called anywhere right now; see `wallets.LIST`'s own note.
		byIdWallet: (id: string) => `/api/v1/businesses/${id}/wallet`,
	},

	// A generic wallet ledger (deposit/withdrawal/internal_transfer/
	// conversion/withdrawal_ghs) — now carries `counterparty`/`direction`/
	// `method`/`business` too (see `TransactionData`), which is what
	// finally let the app's own Transactions/Payments UI move off fake data
	// entirely.
	transactions: {
		LIST: "/api/v1/transactions",
		BALANCES: "/api/v1/transactions/balances",
		EXPORT_CSV: "/api/v1/transactions/export.csv",
		byId: (id: string) => `/api/v1/transactions/${id}`,
	},

	// STREAM (SSE) isn't wired — the notifications panel polls/refetches
	// instead (see useNotifications), same "real data, simpler transport"
	// tradeoff as everywhere else fake-polling stood in for a live feed.
	notifications: {
		LIST: "/api/v1/notifications",
		READ_ALL: "/api/v1/notifications/read-all",
		STREAM: "/api/v1/notifications/stream",
		byIdRead: (id: string) => `/api/v1/notifications/${id}/read`,
		byId: (id: string) => `/api/v1/notifications/${id}`,
	},
};
