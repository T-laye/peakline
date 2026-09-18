"use client";

import { Search, Download } from "lucide-react";
import { Input } from "@repo/ui/input";
import { Select } from "@repo/ui/select";
import { Button } from "@repo/ui/button";
import type { TransactionLedgerStatus } from "@/lib/api/types";

const STATUS_OPTIONS: { value: TransactionLedgerStatus | "all"; label: string }[] = [
	{ value: "all", label: "All statuses" },
	{ value: "pending", label: "Pending" },
	{ value: "processing", label: "Processing" },
	{ value: "completed", label: "Completed" },
	{ value: "failed", label: "Failed" },
	{ value: "reversed", label: "Reversed" },
];

interface PaymentsFiltersProps {
	search: string;
	onSearchChange: (value: string) => void;
	from: string;
	onFromChange: (value: string) => void;
	to: string;
	onToChange: (value: string) => void;
	status: TransactionLedgerStatus | "all";
	onStatusChange: (value: TransactionLedgerStatus | "all") => void;
	onExport: () => void;
}

/**
 * Search + date range + status filter row, per the mock — the same
 * client-side-only filtering `TransactionFilters` already does (no real
 * search/list endpoint to call yet), extended with a real date range (each
 * fake payment carries a genuine `isoDate`, not just a display string) and
 * a real CSV export of whatever's currently filtered. Native
 * `<input type="date">` rather than the mock's custom-styled calendar
 * trigger — a full popover date picker is a lot of one-off UI for a single
 * filter bar; the platform picker does the same job.
 *
 * Mobile only shows Search + the status filter (right-aligned beneath it),
 * per the updated mock's own mobile screenshot — the date range and CSV
 * export stay `lg`-only rather than cluttering a small screen with filters
 * that mock never shows there; both remain fully functional at `lg`.
 */
function PaymentsFilters({
	search,
	onSearchChange,
	from,
	onFromChange,
	to,
	onToChange,
	status,
	onStatusChange,
	onExport,
}: PaymentsFiltersProps) {
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
					placeholder="Search by customer name"
					aria-label="Search payments by customer name"
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

			<div className="flex justify-end lg:contents">
				<Select
					value={status}
					onChange={(e) =>
						onStatusChange(e.target.value as TransactionLedgerStatus | "all")
					}
					aria-label="Filter by status"
					className="w-40 lg:w-44"
				>
					{STATUS_OPTIONS.map((option) => (
						<option key={option.value} value={option.value}>
							{option.label}
						</option>
					))}
				</Select>
			</div>

			<Button type="button" variant="outline" onClick={onExport} className="hidden lg:flex">
				<Download className="size-4" aria-hidden="true" />
				Export CSV
			</Button>
		</div>
	);
}

export { PaymentsFilters };
