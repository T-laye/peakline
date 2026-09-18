import { create } from "zustand";
import Cookies from "js-cookie";
import type { AuthTokensData, CustomerType, UserRole } from "@/lib/api/types";

// Exported (unlike the other cookie names below) so `lib/config/axios.ts`
// can read them straight off `document.cookie` itself — see that file's
// own note on why the refresh flow needs the *live* cookie value rather
// than whatever this module's in-memory state last cached.
export const ACCESS_TOKEN_COOKIE = "pl_access_token";
export const REFRESH_TOKEN_COOKIE = "pl_refresh_token";
const EMAIL_COOKIE = "pl_email";
const CUSTOMER_TYPE_COOKIE = "pl_customer_type";
const USER_ROLE_COOKIE = "pl_user_role";
const WALLET_ADDRESS_COOKIE = "pl_wallet_address";

// A dev-only override used to force `customerType` to "merchant" (for
// building the merchant UI without a real merchant account handy) used to
// live here. Removed — it was still on, live, silently making every real
// individual account request merchant-only endpoints (403 "Merchant
// account required" on things like `/merchant/dashboard/stats", visible in
// the console once query/mutation errors started being logged). This is
// now a pure passthrough; kept as a named function since a few call sites
// below already go through it.
function resolveCustomerType(value: CustomerType | null): CustomerType | null {
	return value;
}

// The backend doesn't document a refresh-token lifetime ("long-lived,
// single-use" is all the spec says) — 30 days is a reasonable default for
// an opaque refresh token; revisit once the backend team confirms the real
// value.
const REFRESH_TOKEN_TTL_DAYS = 30;

// The API is a separate origin (fronted by our own same-origin proxy — see
// src/app/api/proxy) with no way to set httpOnly cookies for us, so tokens
// live in a cookie this app can read itself to attach the Authorization
// header — see lib/config/axios.ts's request interceptor.
const cookieOptions = { secure: true, sameSite: "strict" as const };

// No backend endpoint returns an existing account's `customerType` at login
// — `/auth/login`'s response is tokens only, no profile (confirmed against
// the real API). The only place it's ever set is onboarding's
// `PATCH /auth/customer-type`, right after sign-up. Without this cache,
// logging out (which clears the session cookies below, `customerType`
// included) and back in on the same browser would forget a merchant
// account was ever a merchant — reported live: "when i logged in, it did
// not read the customerType, it entered as a regular individual". Keyed by
// email (not just "the last known type") so a second account logging in on
// the same browser doesn't inherit the first account's type. This is a
// client-side memory aid, not a real fix for the underlying backend gap —
// a genuinely new browser/device still can't know an account's type until
// the backend exposes it somewhere reachable from login.
const CUSTOMER_TYPE_CACHE_KEY = "peakline-customer-type-cache";

function readCustomerTypeCache(): Partial<Record<string, CustomerType>> {
	if (typeof window === "undefined") return {};
	try {
		return JSON.parse(localStorage.getItem(CUSTOMER_TYPE_CACHE_KEY) ?? "{}");
	} catch {
		return {};
	}
}

function cacheCustomerType(email: string, customerType: CustomerType) {
	if (typeof window === "undefined") return;
	try {
		const cache = readCustomerTypeCache();
		cache[email] = customerType;
		localStorage.setItem(CUSTOMER_TYPE_CACHE_KEY, JSON.stringify(cache));
	} catch {
		// Best-effort — worst case, a future login on this browser just
		// doesn't restore the cached type, same as if never cached at all.
	}
}

/**
 * The real, backend-issued session — distinct from `accountSettingsStore`'s
 * `has2FA` flag (a client-only stand-in until 2FA has a real backend) and
 * from `signUpFlowStore`'s pre-verification form state. Cookie-backed
 * rather than zustand's `persist` middleware (unlike the other stores here)
 * so `lib/config/axios.ts`'s interceptors — which run outside React, with
 * no store-hydration lifecycle — can always read the latest tokens
 * straight off `document.cookie`.
 *
 * `/auth/verify-email` and `/auth/login` are the only two endpoints that
 * ever populate this — verify-email logs the user in immediately upon
 * success, same as login does.
 */
interface AuthState {
	accessToken: string | null;
	refreshToken: string | null;
	email: string | null;
	customerType: CustomerType | null;
	/** Not acted on anywhere yet — no admin app in the MVP (CLAUDE.md) — just
	 * captured since it now rides along on login/verify-email. */
	userRole: UserRole | null;
	/** The real Stellar public key, set once `POST /wallets/stellar`
	 * succeeds (sign-up's PIN-setup step). Null until then — there's no
	 * `GET /wallets/stellar` call anywhere yet to hydrate this for an
	 * account that already had a wallet before this browser/cookie existed. */
	walletAddress: string | null;
	isAuthenticated: boolean;
	/** False until `initializeAuth` has run once on mount — lets a route
	 * guard tell "not logged in" apart from "haven't checked cookies yet". */
	isInitialized: boolean;
	setTokens: (tokens: AuthTokensData, email?: string) => void;
	setCustomerType: (customerType: CustomerType) => void;
	setWalletAddress: (walletAddress: string) => void;
	/** Drops the whole session — used on real logout, and internally when a
	 * refresh attempt itself gets rejected (nothing left to retry with). */
	clear: () => void;
	/** Hydrates state from the cookies — call once on mount (see
	 * `AuthProvider`); cookies aren't readable during SSR, so the store
	 * starts unauthenticated on both the server and the first client render
	 * to avoid a hydration mismatch. */
	initializeAuth: () => void;
}

const persistTokens = (tokens: AuthTokensData) => {
	Cookies.set(ACCESS_TOKEN_COOKIE, tokens.accessToken, {
		...cookieOptions,
		expires: tokens.expiresIn / 86_400,
	});
	Cookies.set(REFRESH_TOKEN_COOKIE, tokens.refreshToken, {
		...cookieOptions,
		expires: REFRESH_TOKEN_TTL_DAYS,
	});
};

const clearCookies = () => {
	Cookies.remove(ACCESS_TOKEN_COOKIE);
	Cookies.remove(REFRESH_TOKEN_COOKIE);
	Cookies.remove(EMAIL_COOKIE);
	Cookies.remove(CUSTOMER_TYPE_COOKIE);
	Cookies.remove(USER_ROLE_COOKIE);
	Cookies.remove(WALLET_ADDRESS_COOKIE);
};

const useAuthStore = create<AuthState>((set) => ({
	accessToken: null,
	refreshToken: null,
	email: null,
	customerType: null,
	userRole: null,
	walletAddress: null,
	isAuthenticated: false,
	isInitialized: false,

	setTokens: (tokens, email) => {
		persistTokens(tokens);
		if (email) {
			Cookies.set(EMAIL_COOKIE, email, {
				...cookieOptions,
				expires: REFRESH_TOKEN_TTL_DAYS,
			});
		}
		if (tokens.userRole) {
			Cookies.set(USER_ROLE_COOKIE, tokens.userRole, {
				...cookieOptions,
				expires: REFRESH_TOKEN_TTL_DAYS,
			});
		}
		set((state) => {
			const resolvedEmail = email ?? state.email;
			// The login/verify-email response itself is the authoritative
			// source once the backend actually sends `customerType` — only
			// fall back to the client-side cache (see its own note) while
			// that field is still absent.
			const resolvedType = resolveCustomerType(
				tokens.customerType ??
					(resolvedEmail ? readCustomerTypeCache()[resolvedEmail] : undefined) ??
					null,
			);
			if (resolvedType) {
				Cookies.set(CUSTOMER_TYPE_COOKIE, resolvedType, {
					...cookieOptions,
					expires: REFRESH_TOKEN_TTL_DAYS,
				});
				if (resolvedEmail) cacheCustomerType(resolvedEmail, resolvedType);
			}
			return {
				accessToken: tokens.accessToken,
				refreshToken: tokens.refreshToken,
				email: resolvedEmail,
				customerType: resolvedType ?? state.customerType,
				userRole: tokens.userRole ?? state.userRole,
				isAuthenticated: true,
			};
		});
	},

	setCustomerType: (customerType) => {
		const resolvedType = resolveCustomerType(customerType)!;
		Cookies.set(CUSTOMER_TYPE_COOKIE, resolvedType, {
			...cookieOptions,
			expires: REFRESH_TOKEN_TTL_DAYS,
		});
		set((state) => {
			if (state.email) cacheCustomerType(state.email, resolvedType);
			return { customerType: resolvedType };
		});
	},

	setWalletAddress: (walletAddress) => {
		Cookies.set(WALLET_ADDRESS_COOKIE, walletAddress, {
			...cookieOptions,
			expires: REFRESH_TOKEN_TTL_DAYS,
		});
		set({ walletAddress });
	},

	clear: () => {
		clearCookies();
		set({
			accessToken: null,
			refreshToken: null,
			email: null,
			customerType: null,
			userRole: null,
			walletAddress: null,
			isAuthenticated: false,
		});
	},

	initializeAuth: () => {
		const accessToken = Cookies.get(ACCESS_TOKEN_COOKIE) ?? null;
		const refreshToken = Cookies.get(REFRESH_TOKEN_COOKIE) ?? null;
		const email = Cookies.get(EMAIL_COOKIE) ?? null;
		const customerType = resolveCustomerType(
			(Cookies.get(CUSTOMER_TYPE_COOKIE) as CustomerType | undefined) ?? null,
		);
		const userRole = (Cookies.get(USER_ROLE_COOKIE) as UserRole | undefined) ?? null;
		const walletAddress = Cookies.get(WALLET_ADDRESS_COOKIE) ?? null;

		set({
			accessToken,
			refreshToken,
			email,
			customerType,
			userRole,
			walletAddress,
			isAuthenticated: Boolean(accessToken),
			isInitialized: true,
		});
	},
}));

export { useAuthStore };
