"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { Menu, Store } from "lucide-react";
import { cn } from "@repo/ui/lib/utils";
import { useAuthStore } from "@/lib/stores/authStore";
import { MerchantMobileNav } from "@/components/layouts/MerchantMobileNav";
import { MERCHANT_NAV_ITEMS } from "@/components/layouts/MerchantNavList";

/** Same `sticky top-0` + edge-bleeding treatment as individual's own
 * `MobileStepHeader` — reported live as missing here specifically ("the
 * merchant header should be fixed like that of individuals, so users will
 * always know where they are"). See that component's own note on why the
 * negative margins/padding are exactly what they are: `DashboardLayout`'s
 * mobile content column (the actual scrolling area) has `p-4`, so this
 * cancels that to bleed to the true viewport edges once stuck, then puts
 * the same space back as this element's own padding; the extra top padding
 * clears a notch/status bar when installed as a PWA. */
const HEADER_WRAPPER_CLASS =
	"sticky top-0 z-30 -mx-4 -mt-4 border-b border-border bg-background px-4 pt-[calc(env(safe-area-inset-top)+1rem)] pb-4 lg:hidden";

/** The nav item whose `href` exactly matches this route — excluding
 * Overview's own `href: "/"`, which gets the plain Merchant badge instead
 * of a centered title. `null` means either Overview or a nested/detail
 * route with no exact nav entry; the caller tells those two apart via
 * `pathname === "/"` separately. */
function matchTopLevelItem(pathname: string) {
	return (
		MERCHANT_NAV_ITEMS.find((item) => item.href && item.href !== "/" && pathname === item.href) ?? null
	);
}

/**
 * Merchant-only mobile header row — three states depending on the route,
 * matching individual's own `MobileStepHeader` convention: no back arrow on
 * a primary destination, one only once you're inside a sub-route.
 *
 * - **Overview** (`/`): the "Merchant" badge + hamburger — this is the
 *   account's home, nothing to go "back" to and no title needed either.
 * - **Any other top-level nav destination** (Wallet, Payments, Payment
 *   Links, My QR Code, Transactions, Account): that page's own title,
 *   left-aligned, paired with the hamburger on the right — same as
 *   individual's own primary tab destinations (Wallet, Transactions,
 *   Account) never showing a back arrow either (individual has no drawer to
 *   open, so has no equivalent button here at all). No back arrow: these are
 *   all siblings reachable from the drawer, not a linear stack you navigate
 *   "back" out of. (Previously centered the title via `relative` +
 *   absolutely-positioned hamburger — that combination sets the CSS
 *   `position` property twice on one element alongside `HEADER_WRAPPER_CLASS`'s
 *   own `sticky`, and `cn()`'s tailwind-merge silently dropped `sticky` for
 *   it, which is why this was the one branch NOT actually fixed to the top
 *   despite looking identical to Overview's — reported live as "only the
 *   overview page is fixed header". Plain `justify-between` needs no second
 *   `position` value, so it can't recreate that conflict.)
 * - **Everything else** (a nested/detail route with no exact nav entry of
 *   its own — `/payments/[id]`, `/payment-links/create`, ...): just the
 *   hamburger, right-aligned. The back arrow lives on the page's own header
 *   there instead (e.g. `MobileStepHeader`'s "‹ Payments"), matching
 *   individual's own sub-routes (`/transactions/[id]`) — stacking a second,
 *   generic bar on top of that would just be a second header for one
 *   screen.
 *
 * Individual has no equivalent (mobile stays a flat page with no topbar
 * there, per `DashboardLayout`'s own note) — this renders nothing for that
 * account type, self-branching the same way `Sidebar`/`BottomTabBar`
 * already do, so `DashboardLayout` doesn't need to know or care which
 * account type is active.
 */
function MerchantMobileTopBar() {
	const isMerchant = useAuthStore((state) => state.customerType === "merchant");
	const pathname = usePathname();
	const [open, setOpen] = useState(false);

	if (!isMerchant) return null;

	const isOverview = pathname === "/";
	const match = matchTopLevelItem(pathname);
	const isSubRoute = !isOverview && !match;

	const hamburger = (
		<>
			<button
				type="button"
				onClick={() => setOpen(true)}
				aria-label="Open menu"
				className="flex aspect-square size-10 shrink-0 items-center justify-center rounded-full border border-border text-foreground transition-colors hover:bg-muted"
			>
				<Menu className="size-5" aria-hidden="true" />
			</button>
			<MerchantMobileNav open={open} onOpenChange={setOpen} />
		</>
	);

	if (isSubRoute) {
		return <div className={cn(HEADER_WRAPPER_CLASS, "flex justify-end")}>{hamburger}</div>;
	}

	if (isOverview) {
		return (
			<div className={cn(HEADER_WRAPPER_CLASS, "flex items-center justify-between")}>
				<span className="flex items-center gap-2 rounded-lg bg-primary-500/10 px-3 py-2 text-b3 font-medium text-primary-700">
					<Store className="size-4" aria-hidden="true" />
					Merchant
				</span>
				{hamburger}
			</div>
		);
	}

	return (
		<div className={cn(HEADER_WRAPPER_CLASS, "flex items-center justify-between")}>
			<h1 className="text-s1 text-foreground">{match?.label}</h1>
			{hamburger}
		</div>
	);
}

export { MerchantMobileTopBar };
