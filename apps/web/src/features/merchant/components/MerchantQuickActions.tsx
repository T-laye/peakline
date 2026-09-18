"use client";

import Link from "next/link";
import { Link2, QrCode, HandCoins, ArrowLeftRight } from "lucide-react";
import { Button } from "@repo/ui/button";
import { cn } from "@repo/ui/lib/utils";

const ACTIONS = [
	{ label: "Create Payment Link", href: "/payment-links/create", icon: Link2, variant: "primary" },
	{ label: "Show QR", href: "/qr-code", icon: QrCode, variant: "outline" },
	{ label: "Request Payment", href: "/payment-links/create", icon: HandCoins, variant: "outline" },
	{ label: "View Transactions", href: "/transactions", icon: ArrowLeftRight, variant: "outline" },
] as const;

/**
 * Merchant Overview's own Quick Actions — a horizontal button row on
 * desktop, per the mock, and a 2x2 grid on mobile (the mock's own mobile
 * screenshot). The three outline buttons use the brand green for their
 * text/icon (overriding `Button`'s own `outline` variant, which defaults to
 * plain foreground-colored text) — matching that same mock, not the
 * generic outline treatment used elsewhere in the app (e.g. Payments'
 * "Export CSV").
 *
 * "Create Payment Link" and "Request Payment" both point at
 * `/payment-links/create` — Payment Links replaced Request Payment for
 * merchant accounts entirely (see `Sidebar`'s `MERCHANT_NAV_ITEMS`), so
 * both labels now lead to the one real create flow; split them apart
 * later only if a mock calls for genuinely different screens. "Show QR"
 * goes to the dedicated `/qr-code` page, not `/receive` — a merchant's own
 * store QR is a distinct concept from `/receive`'s wallet-address/payment-
 * link content.
 */
function MerchantQuickActions() {
	return (
		<div className="grid grid-cols-2 gap-3 lg:flex lg:flex-row lg:flex-wrap">
			{ACTIONS.map(({ label, href, icon: Icon, variant }) => (
				<Button
					key={label}
					asChild
					variant={variant}
					size="medium"
					className={cn(
						"w-full gap-1.5 px-3 text-btn-small lg:h-12 lg:w-auto lg:gap-2 lg:px-6 lg:text-btn-large",
						variant === "outline" && "text-primary-600",
					)}
				>
					<Link href={href}>
						<Icon className="size-3.5 shrink-0 lg:size-4" aria-hidden="true" />
						{label}
					</Link>
				</Button>
			))}
		</div>
	);
}

export { MerchantQuickActions };
