"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { LoadingBar } from "@repo/ui/loading-bar";
import { useAuthStore } from "@/lib/stores/authStore";
import { AdminShell } from "@/components/layouts/AdminShell";

/**
 * Route guard for the whole console — unlike apps/web's own
 * `DashboardLayout` (which renders its shell regardless of auth state and
 * leans on the axios interceptor's 401 redirect as the real gate), this
 * redirects immediately and never renders the shell — let alone real
 * platform data — for anyone who isn't a confirmed staff account. The
 * stakes here (account locks, ledger, force-delete) are high enough that
 * "briefly flash the nav before an interceptor catches a 401" isn't an
 * acceptable fallback the way it might be for a consumer dashboard.
 */
export default function Layout({ children }: { children: React.ReactNode }) {
	const router = useRouter();
	const isInitialized = useAuthStore((state) => state.isInitialized);
	const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
	const isStaffVerified = useAuthStore((state) => state.isStaffVerified);

	// Only `!isAuthenticated` ever triggers a redirect here — never a plain
	// `!isStaffVerified` on its own. A fresh login has `isAuthenticated: true`
	// with `isStaffVerified` still `false` for the entire (brief, but real)
	// window `AuthProvider`'s staff-gate call is in flight; redirecting on
	// that alone would boot a legitimate staff member back to /login before
	// their own verification ever got a chance to finish. A *failed*
	// verification already calls `clear()` (see `useStaffGate`), which flips
	// `isAuthenticated` to `false` — that's what actually reaches this
	// effect and sends them back.
	useEffect(() => {
		if (isInitialized && !isAuthenticated) {
			router.replace("/login");
		}
	}, [isInitialized, isAuthenticated, router]);

	if (!isInitialized || !isAuthenticated || !isStaffVerified) {
		return (
			<div className="flex min-h-screen items-center justify-center bg-background">
				<LoadingBar />
			</div>
		);
	}

	return <AdminShell>{children}</AdminShell>;
}
