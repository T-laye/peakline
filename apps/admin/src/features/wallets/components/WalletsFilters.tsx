"use client";

import { Search } from "lucide-react";
import { Input } from "@repo/ui/input";
import { Select } from "@repo/ui/select";
import type { AdminWalletsQuery } from "@/lib/api/types";

interface WalletsFiltersProps {
	search: string;
	onSearchChange: (value: string) => void;
	walletType: AdminWalletsQuery["walletType"] | "all";
	onWalletTypeChange: (value: AdminWalletsQuery["walletType"] | "all") => void;
	isDeactivated: AdminWalletsQuery["isDeactivated"] | "all";
	onIsDeactivatedChange: (value: AdminWalletsQuery["isDeactivated"] | "all") => void;
}

/** The search box filters by exact `userId`, not a free-text `q` — `GET
 * /admin/wallets` has no fuzzy search param like Users/Businesses/
 * Transactions do, only exact-match `userId`/`businessId` (this only wires
 * up the former; a business's own wallet is more easily found from that
 * business's own detail page instead). */
function WalletsFilters({
	search,
	onSearchChange,
	walletType,
	onWalletTypeChange,
	isDeactivated,
	onIsDeactivatedChange,
}: WalletsFiltersProps) {
	return (
		<div className="flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-center">
			<div className="relative flex-1 lg:min-w-56">
				<Search
					className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground"
					aria-hidden="true"
				/>
				<Input
					value={search}
					onChange={(e) => onSearchChange(e.target.value)}
					placeholder="Filter by user ID"
					aria-label="Filter wallets by user ID"
					className="pl-10"
				/>
			</div>

			<Select
				value={walletType}
				onChange={(e) =>
					onWalletTypeChange(e.target.value as AdminWalletsQuery["walletType"] | "all")
				}
				aria-label="Filter by wallet type"
				className="lg:w-44"
			>
				<option value="all">All types</option>
				<option value="individual">Individual</option>
				<option value="merchant">Merchant</option>
			</Select>

			<Select
				value={isDeactivated === "all" ? "all" : String(isDeactivated)}
				onChange={(e) =>
					onIsDeactivatedChange(
						e.target.value === "all" ? "all" : (Number(e.target.value) as 0 | 1),
					)
				}
				aria-label="Filter by status"
				className="lg:w-40"
			>
				<option value="all">Any status</option>
				<option value="0">Active</option>
				<option value="1">Deactivated</option>
			</Select>
		</div>
	);
}

export { WalletsFilters };
