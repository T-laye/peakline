import { create } from "zustand";
import Cookies from "js-cookie";
import type { AuthTokensData, StaffRole } from "@/lib/api/types";

// Exported (unlike the other cookie names below) so `lib/config/axios.ts`
// can read them straight off `document.cookie` itself — see that file's
// own note on why the refresh flow needs the *live* cookie value rather
// than whatever this module's in-memory state last cached.
export const ACCESS_TOKEN_COOKIE = "pla_access_token";
export const REFRESH_TOKEN_COOKIE = "pla_refresh_token";
const EMAIL_COOKIE = "pla_email";
const STAFF_ROLE_COOKIE = "pla_staff_role";

// Distinct cookie prefix ("pla_" vs apps/web's "pl_") — this runs on a
// different port/origin in dev and (eventually) a different subdomain in
// production, but sharing a name with apps/web's own session cookie would
// still be one real footgun to rule out for good: a staff member who's also
// a customer, testing both apps on the same host at some point, must never
// have one app's login silently reuse or clobber the other's session.

// The backend doesn't document a refresh-token lifetime ("long-lived,
// single-use" is all the spec says) — 30 days is a reasonable default,
// matching apps/web's own assumption; revisit once the backend team
// confirms the real value.
const REFRESH_TOKEN_TTL_DAYS = 30;

// The API is a separate origin (fronted by our own same-origin proxy — see
// src/app/api/proxy) with no way to set httpOnly cookies for us, so tokens
// live in a cookie this app can read itself to attach the Authorization
// header — see lib/config/axios.ts's request interceptor.
const cookieOptions = { secure: true, sameSite: "strict" as const };

const clearCookies = () => {
	Cookies.remove(ACCESS_TOKEN_COOKIE);
	Cookies.remove(REFRESH_TOKEN_COOKIE);
	Cookies.remove(EMAIL_COOKIE);
	Cookies.remove(STAFF_ROLE_COOKIE);
};

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

/**
 * The staff session. Unlike apps/web's `authStore`, there's no
 * `customerType` here — the equivalent question ("is this account actually
 * allowed in here") has no login-time answer at all (`/auth/login` returns
 * only tokens, and no endpoint reports your own `role`/`staffRole` except
 * an admin-only one). `isStaffVerified` and `staffRole` are only ever set
 * by `useStaffGate` succeeding, right after tokens are set — see its own
 * note for why that's the actual access-control boundary, not just this
 * store holding a token.
 */
interface AuthState {
	accessToken: string | null;
	refreshToken: string | null;
	email: string | null;
	staffRole: StaffRole | null;
	/** True only once `useStaffGate` has confirmed (via a real admin-only
	 * call) that the current tokens belong to a staff account. A non-null
	 * `accessToken` alone never implies this — the token could just as
	 * easily belong to an ordinary customer who happened to log in here. */
	isStaffVerified: boolean;
	isAuthenticated: boolean;
	/** False until `initializeAuth` has run once on mount — lets a route
	 * guard tell "not logged in" apart from "haven't checked cookies yet". */
	isInitialized: boolean;
	setTokens: (tokens: AuthTokensData, email?: string) => void;
	setStaffVerified: (staffRole: StaffRole) => void;
	/** Drops the whole session — used on real logout, when a refresh attempt
	 * itself gets rejected, and when `useStaffGate` fails (a real token, but
	 * not a staff one — never left half-signed-in). */
	clear: () => void;
	/** Hydrates state from the cookies — call once on mount (see
	 * `AuthProvider`); cookies aren't readable during SSR, so the store
	 * starts unauthenticated on both the server and the first client render
	 * to avoid a hydration mismatch. */
	initializeAuth: () => void;
}

const useAuthStore = create<AuthState>((set) => ({
	accessToken: null,
	refreshToken: null,
	email: null,
	staffRole: null,
	isStaffVerified: false,
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
		set((state) => ({
			accessToken: tokens.accessToken,
			refreshToken: tokens.refreshToken,
			email: email ?? state.email,
			isAuthenticated: true,
			// A fresh token pair hasn't been staff-gated yet, even if a
			// previous session on this browser had been — re-verify every
			// time tokens change (login, or a silent refresh's new pair
			// doesn't need to reset this since it's the same underlying
			// session, but a brand new login always goes through setTokens
			// -> useStaffGate again regardless).
		}));
	},

	setStaffVerified: (staffRole) => {
		Cookies.set(STAFF_ROLE_COOKIE, staffRole, {
			...cookieOptions,
			expires: REFRESH_TOKEN_TTL_DAYS,
		});
		set({ staffRole, isStaffVerified: true });
	},

	clear: () => {
		clearCookies();
		set({
			accessToken: null,
			refreshToken: null,
			email: null,
			staffRole: null,
			isStaffVerified: false,
			isAuthenticated: false,
		});
	},

	initializeAuth: () => {
		const accessToken = Cookies.get(ACCESS_TOKEN_COOKIE) ?? null;
		const refreshToken = Cookies.get(REFRESH_TOKEN_COOKIE) ?? null;
		const email = Cookies.get(EMAIL_COOKIE) ?? null;
		const staffRole = (Cookies.get(STAFF_ROLE_COOKIE) as StaffRole | undefined) ?? null;

		set({
			accessToken,
			refreshToken,
			email,
			staffRole,
			// A cookie carrying a previously-verified role is a reasonable
			// fast-path start (avoids a flash of "checking access..." on
			// every reload) — `AuthProvider` re-runs `useStaffGate` right
			// after anyway, which corrects this the same way apps/web's own
			// `AuthProvider` self-heals `customerType` from a stale cache.
			isStaffVerified: Boolean(accessToken && staffRole),
			isAuthenticated: Boolean(accessToken),
			isInitialized: true,
		});
	},
}));

export { useAuthStore };
