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

interface TransactionsFiltersProps {
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

/** Merchant's own `/transactions` filter bar — identical shape and
 * mobile-compact treatment to `PaymentsFilters` (the two mocks are
 * near-identical), kept as its own component rather than shared since the
 * two pages send genuinely different queries to the same `useTransactions`
 * hook (this one plain, `PaymentsList` with `direction: "incoming"` baked
 * in). From/To bound the real `completedAt` (pending rows are excluded once
 * either is set — same behavior `GET /transactions` itself documents). */
function TransactionsFilters({
	search,
	onSearchChange,
	from,
	onFromChange,
	to,
	onToChange,
	status,
	onStatusChange,
	onExport,
}: TransactionsFiltersProps) {
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
					aria-label="Search transactions by customer name"
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

export { TransactionsFilters };
