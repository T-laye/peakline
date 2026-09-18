"use client";

import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { BottomTabBar } from "./BottomTabBar";
import { MerchantMobileTopBar } from "./MerchantMobileTopBar";
import { useAuthStore } from "@/lib/stores/authStore";
import { cn } from "@repo/ui/lib/utils";
import { LoadingBar } from "@repo/ui/loading-bar";

interface DashboardLayoutProps {
	children: React.ReactNode;
}

/**
 * Persistent dashboard shell. Two distinct treatments per the mock, not one
 * responsively-scaled layout: mobile is a flat white page (no topbar, no
 * floating content card — the account avatar moves into the page's own
 * greeting row instead, see `GreetingHeader`) with `BottomTabBar` for nav;
 * `lg` and up brings in the `Sidebar`, a muted page background, and the
 * topbar + content both floating as rounded cards.
 *
 * Merchant is a third treatment on mobile specifically — `MerchantMobileTopBar`
 * (self-branching, renders nothing for individual) replaces the flat page's
 * missing topbar with a "Merchant" badge + hamburger menu, and `BottomTabBar`
 * itself renders nothing for merchant (no bottom nav at all there anymore).
 *
 * `Sidebar` is `fixed` (see its own comment for why), so it no longer
 * claims space in this flex row — `lg:ml-65` on the content column reserves
 * the same width by hand instead.
 *
 * `customerType` is unknown until `AuthProvider`'s `initializeAuth` reads
 * the cookies on mount — the store starts unauthenticated on both the
 * server and the first client render (avoiding a hydration mismatch), so
 * rendering the individual/merchant shell immediately showed the wrong one
 * for a merchant account for one frame, every refresh (reported live: "any
 * time i refresh there is a glimpse of the individuals dashboard before it
 * shows the merchants dashboard"). Gating on `isInitialized` instead shows
 * a brief neutral loading state both times — same on server and first
 * client paint, so still no mismatch — then the *correct* shell renders
 * directly once the cookie read finishes, with nothing wrong ever visible.
 */
function DashboardLayout({ children }: DashboardLayoutProps) {
	// Merchant has no `BottomTabBar` to leave room for (nav is the sidebar
	// drawer instead) — the extra bottom padding here exists purely to clear
	// that bar, so it'd otherwise be dead space at the bottom of every
	// merchant page.
	const isMerchant = useAuthStore((state) => state.customerType === "merchant");
	const isInitialized = useAuthStore((state) => state.isInitialized);

	if (!isInitialized) {
		return (
			<div className="flex min-h-screen items-center justify-center bg-background">
				<LoadingBar />
			</div>
		);
	}

	return (
		<div className="flex min-h-screen bg-background lg:bg-muted">
			<Sidebar />
			<div
				className={cn(
					"flex min-w-0 flex-1 flex-col gap-4 p-4 lg:ml-65 lg:p-6",
					!isMerchant && "pb-24",
				)}
			>
				<Topbar className="hidden lg:flex" />
				<MerchantMobileTopBar />
				<main className="flex-1 lg:rounded-2xl lg:bg-background lg:p-8 lg:shadow-xs">
					{children}
				</main>
			</div>
			<BottomTabBar />
		</div>
	);
}

export { DashboardLayout };
