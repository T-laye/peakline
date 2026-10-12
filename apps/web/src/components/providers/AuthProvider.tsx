"use client";

import { useEffect, useRef } from "react";
import { useAuthStore } from "@/lib/stores/authStore";
import { useProfile } from "@/features/profile/hooks";
import { useMyBusiness, useCreateBusinessWallet } from "@/features/business/hooks";
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
 *
 * A third: a merchant's own business can exist without its business
 * wallet ever having been created — reported live, "merchant has not
 * created wallet" on every payment attempt against an active, verified
 * business. `useCompleteSignUp` now creates it at sign-up time, but that
 * fix only covers accounts created after it shipped; any merchant whose
 * business predates it is stuck the same way forever unless something
 * retries it. `POST /businesses/{id}/wallet` tolerates already having one
 * (409, handled inside `useCreateBusinessWallet`), so firing it once per
 * business id, every time a merchant's own business loads, is a safe,
 * invisible fix rather than a one-off migration someone has to remember to
 * run.
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

	const isMerchant = customerType === "merchant";
	const { data: business } = useMyBusiness({ enabled: isInitialized && isAuthenticated && isMerchant });
	const createBusinessWallet = useCreateBusinessWallet();
	const walletCheckedForId = useRef<string | null>(null);

	useEffect(() => {
		if (!business?.id || walletCheckedForId.current === business.id) return;
		walletCheckedForId.current = business.id;
		createBusinessWallet.mutate(business.id);
		// `createBusinessWallet` is a fresh mutation object every render (the
		// usual TanStack Query shape) — depending on it would refire this on
		// every unrelated re-render; the ref above is what actually guards
		// against repeating the call for the same business.
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [business?.id]);

	return <>{children}</>;
}

export { AuthProvider };
