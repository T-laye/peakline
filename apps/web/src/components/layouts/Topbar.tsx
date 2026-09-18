"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Store, Undo2 } from "lucide-react";
import { cn } from "@repo/ui/lib/utils";
import { UserAvatar } from "@/features/dashboard/components/UserAvatar";
import { useAuthStore } from "@/lib/stores/authStore";
import { useAccountDisplayName } from "@/features/merchant/hooks";
import { MERCHANT_NAV_ITEMS } from "@/components/layouts/MerchantNavList";
import { NotificationBell } from "@/features/notifications/components/NotificationBell";

interface TopbarProps {
	className?: string;
}

/** "Back to {label}" for any route nested under a top-level nav item (e.g.
 * `/payments/[id]`, `/payment-links/create`) — `null` on the nav items
 * themselves, which keep the plain Merchant badge instead. Prefix match is
 * deliberate here, the mirror image of `MerchantMobileTopBar`'s own exact
 * match: that bar shows a page's *own* title on its exact route, this one
 * shows the *parent* list's title as a "back" link on anything nested under
 * it. The icon sits in its own circle (same size/border/hover treatment as
 * the bell beside it) with the "Back to {label}" text after it, per the
 * reference crop — not icon-only; an earlier pass dropped the visible text
 * entirely, which was wrong. */
function parentBreadcrumb(pathname: string) {
	const match = MERCHANT_NAV_ITEMS.find(
		(item) => item.href && item.href !== "/" && pathname.startsWith(`${item.href}/`),
	);
	return match ? { label: `Back to ${match.label}`, href: match.href as string } : null;
}

/**
 * Desktop-only top bar (the mock has no equivalent on mobile — there, the
 * account avatar moves into the greeting row instead and the bell is
 * dropped entirely, see `GreetingHeader`). The left side is a page
 * title/search field for an individual account, per the original note here
 * — turns out to be exactly where the first merchant mock put its
 * "Merchant" badge instead, so that's what fills it once `customerType` is
 * merchant (or a "Back to {list}" breadcrumb on a nested route, replacing
 * the badge the same way).
 */
function Topbar({ className }: TopbarProps) {
	const isMerchant = useAuthStore((state) => state.customerType === "merchant");
	const displayName = useAccountDisplayName();
	const pathname = usePathname();
	const breadcrumb = isMerchant ? parentBreadcrumb(pathname) : null;

	return (
		<header
			className={cn(
				"items-center justify-between gap-4 rounded-2xl bg-background px-4 py-4 shadow-xs sm:px-6",
				!isMerchant && "justify-end",
				className,
			)}
		>
			{breadcrumb ? (
				<Link href={breadcrumb.href} className="group flex items-center gap-3">
					<span className="flex aspect-square size-10 shrink-0 items-center justify-center rounded-full border border-border text-foreground transition-colors group-hover:bg-muted">
						<Undo2 className="size-4.5" aria-hidden="true" />
					</span>
					<span className="text-b3 font-medium text-foreground group-hover:text-primary-600">
						{breadcrumb.label}
					</span>
				</Link>
			) : (
				isMerchant && (
					<span className="flex items-center gap-2 rounded-lg bg-primary-500/10 px-3 py-2 text-b3 font-medium text-primary-700">
						<Store className="size-4" aria-hidden="true" />
						Merchant
					</span>
				)
			)}

			<div className="flex items-center gap-4">
				<NotificationBell className="size-10" />

				<div className="flex items-center gap-2.5">
					<UserAvatar name={displayName} />
					<span className="text-b2 text-foreground">{displayName}</span>
				</div>
			</div>
		</header>
	);
}

export { Topbar };
