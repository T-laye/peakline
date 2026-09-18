"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/lib/stores/authStore";
import { useProfile } from "@/features/profile/hooks";
import { refreshSession } from "@/lib/config/axios";

/**
 * Hydrates the auth store from the token cookies on first client render.
 * Cookies aren't readable during SSR, so the store's initial state is
 * unauthenticated on both the server and the first client render (avoiding
 * a hydration mismatch) — this patches in the real value right after mount.
 *
 * Also reconciles `customerType` against the real profile
 * (`GET /users/me`, which does carry it — unlike `/auth/login`, confirmed
 * live) on every load where a session exists. This is what's actually
 * authoritative; whatever's cookied/cached client-side can drift from it —
 * as it concretely did once, when a dev-only override forced every login
 * to cache "merchant" regardless of the real account. Running this on
 * every app load (not just at login) means a session already carrying a
 * stale value self-heals the next time the app is opened, with no need to
 * log out and back in.
 *
 * One more self-heal: the access-token cookie is set to expire at the same
 * moment the JWT itself does (short-lived, by design — see `authStore`'s
 * `persistTokens`), so it's entirely normal to mount here with that cookie
 * already gone but a still-valid refresh token sitting right next to it.
 * Proactively refreshing in that case (rather than waiting for whatever
 * request happens to fire first to 401) avoids `isAuthenticated` reading
 * `false` — and this session briefly looking logged out — purely because
 * of when, not whether, the tab happened to reload.
 */
function AuthProvider({ children }: { children: React.ReactNode }) {
	const initializeAuth = useAuthStore((state) => state.initializeAuth);
	const isInitialized = useAuthStore((state) => state.isInitialized);
	const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
	const customerType = useAuthStore((state) => state.customerType);
	const setCustomerType = useAuthStore((state) => state.setCustomerType);

	useEffect(() => {
		initializeAuth();
		const { accessToken, refreshToken } = useAuthStore.getState();
		if (!accessToken && refreshToken) {
			refreshSession();
		}
	}, [initializeAuth]);

	const { data: profile } = useProfile({ enabled: isInitialized && isAuthenticated });

	useEffect(() => {
		if (profile?.customerType && profile.customerType !== customerType) {
			setCustomerType(profile.customerType);
		}
	}, [profile, customerType, setCustomerType]);

	return <>{children}</>;
}

export { AuthProvider };
