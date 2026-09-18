"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/lib/stores/authStore";
import { useStaffGate } from "@/features/auth/hooks";
import { refreshSession } from "@/lib/config/axios";

/**
 * Hydrates the session from cookies on mount, then re-runs the real
 * staff-access check (`useStaffGate`) against whatever it found — a cookie
 * saying "verified" from a previous session is a fast-path starting guess,
 * not something ever trusted on its own (see `authStore`'s own note on why
 * `isStaffVerified` only ever comes from a real backend call). Mirrors
 * apps/web's own `AuthProvider`, which does the equivalent reconciliation
 * for `customerType`.
 *
 * Also proactively refreshes when the access-token cookie has already
 * expired (it's set to die at the same moment the JWT does) but a refresh
 * token is still around — otherwise this mounts with `isAuthenticated:
 * false` purely because of *when* the tab reloaded, not because the session
 * is actually gone, and gets bounced to the login screen for no reason.
 */
function AuthProvider({ children }: { children: React.ReactNode }) {
	const initializeAuth = useAuthStore((state) => state.initializeAuth);
	const isInitialized = useAuthStore((state) => state.isInitialized);
	const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
	const verifyStaffAccess = useStaffGate();

	useEffect(() => {
		initializeAuth();
		const { accessToken, refreshToken } = useAuthStore.getState();
		if (!accessToken && refreshToken) {
			refreshSession();
		}
		// Runs once, on mount — `initializeAuth` is a stable zustand reference.
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	useEffect(() => {
		if (isInitialized && isAuthenticated) {
			verifyStaffAccess();
		}
		// `verifyStaffAccess` is a fresh closure each render (it reads live
		// store state) — re-running it whenever that closure changes would
		// loop; only `isInitialized`/`isAuthenticated` flipping should
		// re-trigger this.
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [isInitialized, isAuthenticated]);

	return <>{children}</>;
}

export { AuthProvider };
