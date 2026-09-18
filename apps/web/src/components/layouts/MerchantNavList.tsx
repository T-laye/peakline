"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
	LayoutGrid,
	Wallet,
	Receipt,
	Link2,
	QrCode,
	ArrowLeftRight,
	User,
} from "lucide-react";
import { cn } from "@repo/ui/lib/utils";

// "Receive" and "Pay" dropped entirely for merchant (their own QR/Payment
// Links cover "getting paid"; scanning to pay someone else isn't a
// merchant flow) — "My QR Code" and "Payment Links" replace them. Profile
// and Settings stay merged into one "Account", same as individual.
// "Customers" removed entirely for now (was rendered disabled, `href:
// null`, as a mock-only placeholder) — hidden rather than shown-but-dead
// until there's a real screen behind it.
export const MERCHANT_NAV_ITEMS = [
	{ label: "Overview", href: "/", icon: LayoutGrid },
	{ label: "Wallet", href: "/wallet", icon: Wallet },
	{ label: "Payments", href: "/payments", icon: Receipt },
	{ label: "Payment Links", href: "/payment-links", icon: Link2 },
	{ label: "My QR Code", href: "/qr-code", icon: QrCode },
	{ label: "Transactions", href: "/transactions", icon: ArrowLeftRight },
	{ label: "Accounts", href: "/account", icon: User },
] as const;

/** True for the item's own route, and (except the root Overview item) any
 * route nested under it — so e.g. /transactions/123 still highlights
 * "Transactions". */
function isActive(pathname: string, href: string) {
	if (href === "/") return pathname === "/";
	return pathname === href || pathname.startsWith(`${href}/`);
}

/**
 * The merchant nav's item list — shared by the desktop `Sidebar` and the
 * mobile slide-in `MerchantMobileNav` (merchant no longer uses
 * `BottomTabBar` at all, per the updated mock) so the two can't drift
 * apart. Always dark-themed, since both callers render it on the same dark
 * green surface. `onNavigate` closes the mobile drawer on link click; the
 * desktop sidebar leaves it undefined (nothing to close).
 */
function MerchantNavList({
	onNavigate,
	className,
}: {
	onNavigate?: () => void;
	className?: string;
}) {
	const pathname = usePathname();

	return (
		<nav className={cn("flex flex-col gap-1", className)}>
			{MERCHANT_NAV_ITEMS.map(({ label, href, icon: Icon }) => {
				const active = isActive(pathname, href);
				return (
					<Link
						key={href}
						href={href}
						onClick={onNavigate}
						aria-current={active ? "page" : undefined}
						className={cn(
							"flex items-center gap-3 rounded-lg px-3 py-2.5 text-b3 font-medium transition-colors",
							active
								? "bg-background text-primary-800"
								: "text-primary-100 hover:bg-primary-700",
						)}
					>
						<Icon className="size-4.5 shrink-0" aria-hidden="true" />
						{label}
					</Link>
				);
			})}
		</nav>
	);
}

export { MerchantNavList };
