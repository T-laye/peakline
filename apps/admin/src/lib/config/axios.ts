import axios, {
	AxiosError,
	AxiosInstance,
	InternalAxiosRequestConfig,
} from "axios";
import Cookies from "js-cookie";
import {
	useAuthStore,
	ACCESS_TOKEN_COOKIE,
	REFRESH_TOKEN_COOKIE,
} from "@/lib/stores/authStore";
import { apiRoutes } from "@/lib/config/apiRoutes";
import type { ApiSuccessResponse, AuthTokensData } from "@/lib/api/types";

// Same-origin proxy (see src/app/api/proxy/[...path]/route.ts) — the real
// API host and the `peakline-ref` app-key it requires both live server-side
// only. The browser never talks to the backend directly. Mirrors apps/web's
// own lib/config/axios.ts — same logging/timeout conventions, so a stuck
// request or a real backend bug shows up here exactly the way it already
// does over there.
const PROXY_BASE_URL = "/api/proxy";

// Longer than the proxy route's own `UPSTREAM_TIMEOUT_MS` (20s) on purpose —
// that timeout should always fire first and hand back a real, backend-shaped
// 504 body, with this one only as a last-resort backstop for the proxy
// itself hanging. No request is allowed to sit in "loading" forever.
const REQUEST_TIMEOUT_MS = 25_000;

// No auth header — login, and the token refresh call itself (must not go
// through axiosAuth, or a failed refresh would loop).
export const axiosPublic = axios.create({
	baseURL: PROXY_BASE_URL,
	headers: { "Content-Type": "application/json" },
	timeout: REQUEST_TIMEOUT_MS,
});

// Attaches the bearer token and retries once with a refreshed token on 401.
export const axiosAuth = axios.create({
	baseURL: PROXY_BASE_URL,
	headers: { "Content-Type": "application/json" },
	timeout: REQUEST_TIMEOUT_MS,
});

// ---------------------------------------------------------------------
// Console logging for every API call, success or error — every request
// this app makes goes through axiosPublic/axiosAuth, so hooking logging in
// here covers the whole app.
// ---------------------------------------------------------------------
type TimedConfig = InternalAxiosRequestConfig & { __startedAt?: number };

const REDACTED_KEYS = ["password", "totpCode", "temporaryPassword"];

const redact = (data: unknown) => {
	if (!data || typeof data !== "object") return data;

	const clone = { ...(data as Record<string, unknown>) };
	for (const key of REDACTED_KEYS) {
		if (key in clone) clone[key] = "••••••";
	}
	return clone;
};

const attachApiLogging = (instance: AxiosInstance, label: string) => {
	instance.interceptors.request.use((config) => {
		(config as TimedConfig).__startedAt = Date.now();
		console.log(
			`%c[api:${label}] -> ${(config.method ?? "get").toUpperCase()} ${config.url}`,
			"color:#9B9B9B",
		);
		return config;
	});

	instance.interceptors.response.use(
		(response) => {
			const config = response.config as TimedConfig;
			const duration = config.__startedAt ? Date.now() - config.__startedAt : undefined;

			console.groupCollapsed(
				`%c[api:${label}] <- %c${response.status} %c${(config.method ?? "get").toUpperCase()} ${config.url}%c ${duration ?? "?"}ms`,
				"color:#9B9B9B",
				"color:#16a34a;font-weight:600",
				"color:inherit",
				"color:#9B9B9B",
			);
			if (config.data) console.log("request:", redact(config.data));
			if (config.params) console.log("params:", config.params);
			console.log("response:", response.data);
			console.groupEnd();

			return response;
		},
		(error: AxiosError) => {
			const config = error.config as TimedConfig | undefined;
			const duration = config?.__startedAt ? Date.now() - config.__startedAt : undefined;
			const status = error.response?.status;
			const isTimeout = !error.response && error.code === "ECONNABORTED";
			const isNetworkError = !error.response && !isTimeout;
			const kind = isTimeout ? "TIMEOUT" : isNetworkError ? "NETWORK" : String(status ?? "ERR");

			const isClientError = typeof status === "number" && status >= 400 && status < 500;
			const log = isClientError ? console.warn : console.error;

			console.groupCollapsed(
				`%c[api:${label}] xx %c${kind} %c${(config?.method ?? "?").toUpperCase()} ${config?.url ?? "unknown"}%c ${duration ?? "?"}ms`,
				"color:#9B9B9B",
				isClientError ? "color:#d97706;font-weight:600" : "color:#dc2626;font-weight:600",
				"color:inherit",
				"color:#9B9B9B",
			);
			if (config?.data) console.log("request:", redact(config.data));
			if (config?.params) console.log("params:", config.params);
			log(
				`[api:${label}] ${kind} ${(config?.method ?? "?").toUpperCase()} ${config?.url ?? "unknown"} (${duration ?? "?"}ms) — error:`,
				error.response?.data ?? error.message,
			);
			console.groupEnd();

			return Promise.reject(error);
		},
	);
};

// Dev-only — see apps/web's own copy of this same interceptor for why
// (unconditional console logging on every request cost every real user
// something for zero benefit outside dev).
if (process.env.NODE_ENV !== "production") {
	attachApiLogging(axiosPublic, "public");
	attachApiLogging(axiosAuth, "auth");
}

axiosAuth.interceptors.request.use((config) => {
	const token = useAuthStore.getState().accessToken;

	if (token) {
		config.headers.Authorization = `Bearer ${token}`;
	}

	return config;
});

// Shared across concurrent 401s *in this tab* so a burst of requests
// triggers one refresh call instead of one per request. Doesn't help across
// tabs — see the localStorage lock below for that half.
let refreshPromise: Promise<string | null> | null = null;

// `AuthTokensData.refreshToken` is long-lived and single-use — reusing a
// consumed one revokes the whole token family (all devices). A single tab
// already can't violate that (`refreshPromise` above dedupes concurrent
// callers onto one request), but *two tabs* share the same cookie jar with
// no way to know about each other otherwise: if both tabs' access tokens
// expire around the same time (typical — they usually logged in together),
// each tab independently reads its own in-memory `refreshToken`, and
// whichever one refreshes second sends a token the other tab has already
// rotated away — a guaranteed "theft" reuse that takes *both* tabs' staff
// sessions down together. Reported live on apps/web's own equivalent code
// as "logged out for no reason, the cookie disappears": that's this, not a
// real security event. A staff console is if anything more likely to have
// several tabs open at once (a list view plus a couple of detail pages) than
// a customer-facing app, so this mirrors the same fix there.
//
// A plain `localStorage` key as a cross-tab mutex fixes it — `localStorage`
// (unlike cookies) is also just a same-origin, synchronously-readable
// key/value store, so it works fine as a lock even though it's carrying no
// actual auth data. Short TTL so a tab that crashed mid-refresh can't wedge
// every other tab out indefinitely.
const REFRESH_LOCK_KEY = "peakline-admin-refresh-lock";
const REFRESH_LOCK_TTL_MS = 10_000;

function acquireRefreshLock(): boolean {
	if (typeof window === "undefined") return true;
	try {
		const held = localStorage.getItem(REFRESH_LOCK_KEY);
		if (held && Date.now() - Number(held) < REFRESH_LOCK_TTL_MS) return false;
		localStorage.setItem(REFRESH_LOCK_KEY, String(Date.now()));
		return true;
	} catch {
		// localStorage unavailable (private browsing, quota, disabled) —
		// fall back to no cross-tab coordination rather than blocking the
		// refresh a single tab still needs to do.
		return true;
	}
}

function releaseRefreshLock() {
	if (typeof window === "undefined") return;
	try {
		localStorage.removeItem(REFRESH_LOCK_KEY);
	} catch {
		// Non-fatal — the lock just expires on its own via the TTL above.
	}
}

const refreshAccessToken = async (): Promise<string | null> => {
	// The live cookie, not `useAuthStore.getState().refreshToken` — cookies
	// are the one piece of storage every tab actually shares, so this is
	// the newest value regardless of which tab last rotated it.
	const refreshToken = Cookies.get(REFRESH_TOKEN_COOKIE) ?? null;

	if (!refreshToken) return null;

	if (!acquireRefreshLock()) {
		// Another tab is refreshing right now with (as far as this tab can
		// tell) the same token — wait for it to finish rather than racing
		// it with a second call, then adopt whatever it wrote.
		await new Promise((resolve) => setTimeout(resolve, 700));
		const rotatedAccessToken = Cookies.get(ACCESS_TOKEN_COOKIE) ?? null;
		if (rotatedAccessToken) {
			useAuthStore.getState().initializeAuth();
			return rotatedAccessToken;
		}
		// It didn't finish (or it failed) in time — fall through and try
		// this tab's own request rather than giving up.
	}

	try {
		const { data } = await axiosPublic.post<ApiSuccessResponse<AuthTokensData>>(
			apiRoutes.auth.REFRESH,
			{ refreshToken },
		);

		useAuthStore.getState().setTokens(data.data);
		return data.data.accessToken;
	} catch {
		// The refresh token itself was rejected — genuinely expired, or
		// (now that reuse is guarded against above) actually revoked
		// server-side for some other reason. Nothing left to retry with.
		useAuthStore.getState().clear();
		return null;
	} finally {
		releaseRefreshLock();
	}
};

/** Same dedupe the 401 handler below uses, exposed for `AuthProvider` to
 * call proactively right after `initializeAuth` — if the access-token
 * cookie has already expired (it's set to die at the same moment the JWT
 * does, see `authStore`'s `persistTokens`) but a refresh token is still
 * around, there's no reason to wait for a lazy 401 on whatever request
 * happens to fire first. */
export function refreshSession() {
	refreshPromise ??= refreshAccessToken().finally(() => {
		refreshPromise = null;
	});
	return refreshPromise;
}

axiosAuth.interceptors.response.use(
	(response) => response,
	async (error: AxiosError) => {
		const originalRequest = error.config as
			| (InternalAxiosRequestConfig & { _retry?: boolean })
			| undefined;

		if (
			error.response?.status === 401 &&
			originalRequest &&
			!originalRequest._retry
		) {
			originalRequest._retry = true;

			const newToken = await refreshSession();

			if (newToken) {
				originalRequest.headers.Authorization = `Bearer ${newToken}`;
				return axiosAuth(originalRequest);
			}

			if (typeof window !== "undefined") {
				// A plain axios interceptor, not a React component — there's no
				// `useRouter()` available here, so a full navigation is the only
				// option.
				// eslint-disable-next-line @next/next/no-location-assign-relative-destination
				window.location.href = "/login";
			}
		}

		return Promise.reject(error);
	},
);
