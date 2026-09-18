"use client";

import { Search } from "lucide-react";
import { Input } from "@repo/ui/input";
import { Select } from "@repo/ui/select";
import type { TransactionLedgerStatus } from "@/lib/api/types";

const STATUS_OPTIONS: { value: TransactionLedgerStatus | "all"; label: string }[] = [
	{ value: "all", label: "All statuses" },
	{ value: "pending", label: "Pending" },
	{ value: "processing", label: "Processing" },
	{ value: "completed", label: "Completed" },
	{ value: "failed", label: "Failed" },
	{ value: "reversed", label: "Reversed" },
];

interface TransactionFiltersProps {
	search: string;
	onSearchChange: (value: string) => void;
	status: TransactionLedgerStatus | "all";
	onStatusChange: (value: TransactionLedgerStatus | "all") => void;
}

/** Search-by-name + status filter row atop the history list — both now sent
 * straight to the real `GET /transactions` (`q`/`status`), not filtered
 * client-side against an already-fetched page. */
function TransactionFilters({
	search,
	onSearchChange,
	status,
	onStatusChange,
}: TransactionFiltersProps) {
	return (
		<div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
			<div className="relative flex-1">
				<Search
					className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground"
					aria-hidden="true"
				/>
				<Input
					value={search}
					onChange={(e) => onSearchChange(e.target.value)}
					placeholder="Search by name"
					aria-label="Search transactions by name"
					className="pl-10"
				/>
			</div>
			<Select
				value={status}
				onChange={(e) =>
					onStatusChange(e.target.value as TransactionLedgerStatus | "all")
				}
				aria-label="Filter by status"
				className="sm:w-52"
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

export { TransactionFilters };
