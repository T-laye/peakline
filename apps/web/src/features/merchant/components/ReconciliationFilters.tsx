"use client";

import { Search } from "lucide-react";
import { Input } from "@repo/ui/input";
import { Select } from "@repo/ui/select";
import type { ReconciliationStatus } from "@/lib/api/types";

const STATUS_OPTIONS: { value: ReconciliationStatus | "all"; label: string }[] = [
	{ value: "all", label: "All statuses" },
	{ value: "matched", label: "Matched" },
	{ value: "unmatched", label: "Unmatched" },
	{ value: "amount_mismatch", label: "Mismatched" },
	{ value: "failed", label: "Failed" },
];

interface ReconciliationFiltersProps {
	search: string;
	onSearchChange: (value: string) => void;
	from: string;
	onFromChange: (value: string) => void;
	to: string;
	onToChange: (value: string) => void;
	status: ReconciliationStatus | "all";
	onStatusChange: (value: ReconciliationStatus | "all") => void;
}

/** Same shape as `PaymentsFilters` — search + date range + status — minus
 * the Export CSV button: `GET /merchant/reconciliation` has no
 * `export.csv` sibling (unlike payment links/transactions, both confirmed
 * live), so there's nothing real to wire one up to. "Pending" (a deposit
 * that hasn't completed yet) isn't a filterable `status` value on the real
 * endpoint either — only the four real `reconciliationStatus` values are
 * (see `displayReconciliationStatus`'s own note on why "Pending" is a
 * display-only derived state).
 */
function ReconciliationFilters({
	search,
	onSearchChange,
	from,
	onFromChange,
	to,
	onToChange,
	status,
	onStatusChange,
}: ReconciliationFiltersProps) {
	return (
		<div className="flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-center">
			<div className="relative flex-1 lg:min-w-48">
				<Search
					className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground"
					aria-hidden="true"
				/>
				<Input
					value={search}
					onChange={(e) => onSearchChange(e.target.value)}
					placeholder="Search by ID"
					aria-label="Search reconciliation records by ID"
					className="pl-10"
				/>
			</div>

			<div className="hidden items-center gap-2 lg:flex">
				<span className="text-b3 text-muted-foreground">From</span>
				<Input
					type="date"
					value={from}
					onChange={(e) => onFromChange(e.target.value)}
					aria-label="From date"
					className="lg:w-40"
				/>
			</div>

			<div className="hidden items-center gap-2 lg:flex">
				<span className="text-b3 text-muted-foreground">To</span>
				<Input
					type="date"
					value={to}
					onChange={(e) => onToChange(e.target.value)}
					aria-label="To date"
					className="lg:w-40"
				/>
			</div>

			<Select
				value={status}
				onChange={(e) => onStatusChange(e.target.value as ReconciliationStatus | "all")}
				aria-label="Filter by reconciliation status"
				className="w-40 lg:w-44"
			>
				{STATUS_OPTIONS.map((option) => (
					<option key={option.value} value={option.value}>
						{option.label}
					</option>
				))}
			</Select>
		</div>
	);
}

export { ReconciliationFilters };
