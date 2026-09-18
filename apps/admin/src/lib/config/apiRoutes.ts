/**
 * Real backend paths, forwarded verbatim by the same-origin proxy
 * (`src/app/api/proxy/[...path]/route.ts`), so these already include the
 * `/api/v1` prefix the actual API expects. Mirrors apps/web's own
 * `apiRoutes.ts` structure — full admin surface listed up front (confirmed
 * live against `/docs-json`) even though only `auth`/`analytics` are wired
 * to a screen yet, so later phases just add hooks, not route strings.
 */
export const apiRoutes = {
	auth: {
		LOGIN: "/api/v1/auth/login",
		REFRESH: "/api/v1/auth/refresh",
		LOGOUT: "/api/v1/auth/logout",
		TWO_FA_VERIFY: "/api/v1/auth/2fa/verify",
	},

	// Confirms "am I actually staff" post-login — see `useStaffGate`. Any
	// admin-only GET would do; this one doubles as the dashboard home's own
	// data, so login and the first real screen share one call.
	analytics: {
		OVERVIEW: "/api/v1/admin/analytics/overview",
		USERS: "/api/v1/admin/analytics/users",
		TRANSACTIONS: "/api/v1/admin/analytics/transactions",
		BUSINESSES: "/api/v1/admin/analytics/businesses",
	},

	users: {
		BASE: "/api/v1/admin/users",
		byId: (id: string) => `/api/v1/admin/users/${id}`,
		byIdLock: (id: string) => `/api/v1/admin/users/${id}/lock`,
		byIdUnlock: (id: string) => `/api/v1/admin/users/${id}/unlock`,
		byIdKycTier: (id: string) => `/api/v1/admin/users/${id}/kyc-tier`,
		byIdRole: (id: string) => `/api/v1/admin/users/${id}/role`,
		byIdDeletionRequest: (id: string) => `/api/v1/admin/users/${id}/deletion-request`,
		byIdForceDelete: (id: string) => `/api/v1/admin/users/${id}/force-delete`,
		byIdSessions: (id: string) => `/api/v1/admin/users/${id}/sessions`,
		byIdTwoFa: (id: string) => `/api/v1/admin/users/${id}/2fa`,
	},

	businesses: {
		BASE: "/api/v1/admin/businesses",
		byId: (id: string) => `/api/v1/admin/businesses/${id}`,
		byIdVerify: (id: string) => `/api/v1/admin/businesses/${id}/verify`,
		byIdSuspend: (id: string) => `/api/v1/admin/businesses/${id}/suspend`,
		byIdReactivate: (id: string) => `/api/v1/admin/businesses/${id}/reactivate`,
		byIdStatusHistory: (id: string) => `/api/v1/admin/businesses/${id}/status-history`,
		byIdMembers: (id: string) => `/api/v1/admin/businesses/${id}/members`,
		byIdWallets: (id: string) => `/api/v1/admin/businesses/${id}/wallets`,
		byIdPaymentLinks: (id: string) => `/api/v1/admin/businesses/${id}/payment-links`,
	},

	wallets: {
		BASE: "/api/v1/admin/wallets",
		byId: (id: string) => `/api/v1/admin/wallets/${id}`,
		byIdDeactivate: (id: string) => `/api/v1/admin/wallets/${id}/deactivate`,
		byIdReactivate: (id: string) => `/api/v1/admin/wallets/${id}/reactivate`,
		byIdFundingIntents: (id: string) => `/api/v1/admin/wallets/${id}/funding-intents`,
	},

	transactions: {
		BASE: "/api/v1/admin/transactions",
		EXPORT_CSV: "/api/v1/admin/transactions/export.csv",
		byId: (id: string) => `/api/v1/admin/transactions/${id}`,
		byIdLedgerEntries: (id: string) => `/api/v1/admin/transactions/${id}/ledger-entries`,
		byIdReverse: (id: string) => `/api/v1/admin/transactions/${id}/reverse`,
		byIdStatus: (id: string) => `/api/v1/admin/transactions/${id}/status`,
	},

	ledger: {
		ACCOUNTS: "/api/v1/admin/ledger/accounts",
		byAccountId: (id: string) => `/api/v1/admin/ledger/accounts/${id}`,
		SYSTEM_ACCOUNTS: "/api/v1/admin/ledger/system-accounts",
		BALANCES: "/api/v1/admin/ledger/balances",
	},

	paymentLinks: {
		BASE: "/api/v1/admin/payment-links",
		byId: (id: string) => `/api/v1/admin/payment-links/${id}`,
		byIdCancel: (id: string) => `/api/v1/admin/payment-links/${id}/cancel`,
	},

	config: {
		BASE: "/api/v1/admin/config",
		byKey: (key: string) => `/api/v1/admin/config/${key}`,
	},

	staff: {
		BASE: "/api/v1/admin/staff",
		INVITE: "/api/v1/admin/staff/invite",
		byIdRole: (id: string) => `/api/v1/admin/staff/${id}/role`,
		byId: (id: string) => `/api/v1/admin/staff/${id}`,
	},

	auditLog: {
		BASE: "/api/v1/admin/audit-log",
		byId: (id: string) => `/api/v1/admin/audit-log/${id}`,
	},
};
