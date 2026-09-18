"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
	LayoutGrid,
	Wallet,
	Send,
	ArrowDownLeft,
	ScanLine,
	ArrowLeftRight,
	User,
	LogOut,
} from "lucide-react";
import { Logo } from "@repo/ui/logo";
import { cn } from "@repo/ui/lib/utils";
import { useAuthStore } from "@/lib/stores/authStore";
import { MerchantNavList } from "@/components/layouts/MerchantNavList";
import { LogoutConfirmDialog } from "@/components/layouts/LogoutConfirmDialog";

// Profile and Settings used to be separate nav items/pages — merged into
// one "Account" destination, so there's one place for identity + account
// management instead of two half-empty ones.
const INDIVIDUAL_NAV_ITEMS = [
	{ label: "Dashboard", href: "/", icon: LayoutGrid },
	{ label: "Wallet", href: "/wallet", icon: Wallet },
	{ label: "Send", href: "/send", icon: Send },
	{ label: "Receive", href: "/receive", icon: ArrowDownLeft },
	{ label: "Pay", href: "/pay", icon: ScanLine },
	{ label: "Transactions", href: "/transactions", icon: ArrowLeftRight },
	{ label: "Accounts", href: "/account", icon: User },
] as const;

/** True for the item's own route, and (except the root Dashboard item) any
 * route nested under it — so e.g. /transactions/123 still highlights
 * "Transactions". */
function isActive(pathname: string, href: string) {
	if (href === "/") return pathname === "/";
	return pathname === href || pathname.startsWith(`${href}/`);
}

/**
 * Desktop-only primary nav — below `lg` this is replaced by `BottomTabBar`
 * for individual, or a hamburger-triggered slide-in drawer for merchant
 * (see `MerchantMobileNav` — merchant dropped the bottom tab bar entirely
 * per the updated mock), not collapsed into a drawer for individual, per
 * the mobile mock.
 *
 * `fixed`, not `sticky`, and deliberately so: a Radix Dialog (Fund Wallet)
 * locks scroll by setting `overflow: hidden` on `<body>`, which makes body
 * a new scroll container sitting between `html` (the page's real scrolling
 * element) and this sidebar — that breaks a `sticky` sidebar's positioning
 * math entirely, so opening the modal while scrolled down made it jump to
 * track the scroll offset instead of staying pinned. `fixed` anchors to the
 * viewport directly and doesn't care what any ancestor's overflow is.
 * `DashboardLayout` reserves this width on the content column with
 * `lg:ml-65` since a fixed element no longer occupies flex layout space.
 *
 * Merchant gets a fully distinct dark theme + nav here, not the individual
 * sidebar with a couple of items merged in — confirmed with the user
 * against the first merchant mock (a solid dark-green sidebar with an
 * inverted, white active-pill), since merchant reads as its own "mode"
 * rather than an individual account with extras. The nav item list itself
 * (`MerchantNavList`) is shared with the mobile drawer so the two can't
 * drift apart.
 */
function Sidebar() {
	const pathname = usePathname();
	const isMerchant = useAuthStore((state) => state.customerType === "merchant");

	return (
		<aside
			className={cn(
				"fixed inset-y-0 left-0 z-30 hidden h-screen w-65 shrink-0 flex-col gap-8 px-4 py-6 lg:flex",
				isMerchant
					? "bg-primary-800 text-primary-100"
					: "border-r border-border bg-background",
			)}
		>
			{/* `dark-logo.svg` renders directly on this dark fill (unlike the
			    default wordmark, its colors are already tuned for a dark
			    backing) — no light chip needed. Merchant gets a divider under
			    it, per the updated mock — individual's own header area has
			    never had one. */}
			{isMerchant ? (
				<div className="border-b border-primary-100/20 pb-6">
					<Logo size="lg" variant="dark" />
				</div>
			) : (
				<Logo size="lg" variant="default" className="px-2" />
			)}

			{isMerchant ? (
				<MerchantNavList className="flex-1 overflow-y-auto" />
			) : (
				<nav className="flex flex-1 flex-col gap-1 overflow-y-auto">
					{INDIVIDUAL_NAV_ITEMS.map(({ label, href, icon: Icon }) => {
						const active = isActive(pathname, href);
						return (
							<Link
								key={href}
								href={href}
								aria-current={active ? "page" : undefined}
								className={cn(
									"flex items-center gap-3 rounded-lg px-3 py-2.5 text-b3 font-medium transition-colors",
									active
										? "bg-primary-500 text-primary-foreground"
										: "text-foreground hover:bg-muted",
								)}
							>
								<Icon className="size-4.5 shrink-0" aria-hidden="true" />
								{label}
							</Link>
						);
					})}
				</nav>
			)}

			<LogoutConfirmDialog>
				<button
					type="button"
					className={cn(
						"flex items-center gap-3 rounded-lg px-3 py-2.5 text-b3 font-medium text-destructive transition-colors",
						isMerchant ? "hover:bg-primary-700" : "hover:bg-danger-100",
					)}
				>
					<LogOut className="size-4.5 shrink-0" aria-hidden="true" />
					Logout
				</button>
			</LogoutConfirmDialog>
		</aside>
	);
}

export { Sidebar };
