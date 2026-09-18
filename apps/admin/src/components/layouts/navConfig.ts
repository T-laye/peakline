import type { LucideIcon } from "lucide-react";
import {
	LayoutDashboard,
	Users,
	Building2,
	Wallet,
	ArrowLeftRight,
	BookOpen,
	Link2,
	Settings,
	ShieldCheck,
	ScrollText,
} from "lucide-react";
import type { StaffRole } from "@/lib/api/types";

interface NavItem {
	label: string;
	href: string;
	icon: LucideIcon;
	/** Omitted = every staff role can see it. Present = only these roles —
	 * mirrors how sensitive the real endpoints behind each section are
	 * (see the build plan's own phase notes): Config/Staff management can
	 * mint other admins or change platform-wide settings, so those stay
	 * super_admin-only at the nav level too, even though the backend's own
	 * guard is the real enforcement either way. */
	roles?: StaffRole[];
}

/** Grouped by domain, matching the backend's own tag groups 1:1 (Users,
 * Businesses, Wallets, Transactions, Ledger, Payment Links, Config, Staff,
 * Audit Log) — Analytics folds into "Overview" as the dashboard home rather
 * than getting its own nav item. Every route is built as of Phase 4
 * (Payment Links/Config/Staff, the last group still stubbed) — the full
 * shape was linked here from Phase 0 on, before any of it existed, so the
 * nav never needed re-arguing per phase; see `ComingSoonPage` for the
 * placeholder every not-yet-built route rendered until its own phase
 * landed.
 */
const NAV_GROUPS: { label: string; items: NavItem[] }[] = [
	{
		label: "",
		items: [{ label: "Overview", href: "/", icon: LayoutDashboard }],
	},
	{
		label: "Platform",
		items: [
			{ label: "Users", href: "/users", icon: Users },
			{ label: "Businesses", href: "/businesses", icon: Building2 },
			{ label: "Wallets", href: "/wallets", icon: Wallet },
			{ label: "Transactions", href: "/transactions", icon: ArrowLeftRight },
			{ label: "Ledger", href: "/ledger", icon: BookOpen },
			{ label: "Payment Links", href: "/payment-links", icon: Link2 },
		],
	},
	{
		label: "Administration",
		items: [
			{
				label: "Config",
				href: "/config",
				icon: Settings,
				roles: ["super_admin"],
			},
			{
				label: "Staff",
				href: "/staff",
				icon: ShieldCheck,
				roles: ["super_admin"],
			},
			{ label: "Audit Log", href: "/audit-log", icon: ScrollText },
		],
	},
];

export { NAV_GROUPS };
export type { NavItem };
