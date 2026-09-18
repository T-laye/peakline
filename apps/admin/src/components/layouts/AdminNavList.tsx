"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@repo/ui/lib/utils";
import { useAuthStore } from "@/lib/stores/authStore";
import { NAV_GROUPS } from "@/components/layouts/navConfig";

/**
 * The grouped nav item list — shared by the desktop `Sidebar` and the
 * mobile slide-in `AdminMobileNav` so the two can't drift apart (same
 * "extract once, both callers render it" pattern apps/web's own
 * `MerchantNavList` uses for its sidebar/drawer pair). `onNavigate` closes
 * the mobile drawer on link click; the desktop sidebar leaves it
 * undefined (nothing to close there).
 */
function AdminNavList({ onNavigate, className }: { onNavigate?: () => void; className?: string }) {
	const pathname = usePathname();
	const staffRole = useAuthStore((state) => state.staffRole);

	return (
		<nav className={cn("flex flex-col gap-6", className)}>
			{NAV_GROUPS.map((group) => {
				const items = group.items.filter(
					(item) => !item.roles || (staffRole && item.roles.includes(staffRole)),
				);
				if (items.length === 0) return null;
				return (
					<div key={group.label || "root"} className="flex flex-col gap-1">
						{group.label && (
							<span className="px-3 pb-1 text-c3 font-semibold tracking-wide text-muted-foreground uppercase">
								{group.label}
							</span>
						)}
						{items.map((item) => {
							const isActive =
								item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
							return (
								<Link
									key={item.href}
									href={item.href}
									onClick={onNavigate}
									aria-current={isActive ? "page" : undefined}
									className={cn(
										"flex items-center gap-3 rounded-lg px-3 py-2 text-b3 font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
										isActive &&
											"bg-primary-100 text-primary-800 hover:bg-primary-100 hover:text-primary-800",
									)}
								>
									<item.icon className="size-4.5 shrink-0" aria-hidden="true" />
									{item.label}
								</Link>
							);
						})}
					</div>
				);
			})}
		</nav>
	);
}

export { AdminNavList };
