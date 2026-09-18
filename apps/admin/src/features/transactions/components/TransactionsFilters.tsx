"use client";

import { Search } from "lucide-react";
import { Input } from "@repo/ui/input";
import { Select } from "@repo/ui/select";
import type { AdminTransactionsQuery } from "@/lib/api/types";

interface TransactionsFiltersProps {
	search: string;
	onSearchChange: (value: string) => void;
	type: AdminTransactionsQuery["type"] | "all";
	onTypeChange: (value: AdminTransactionsQuery["type"] | "all") => void;
	status: AdminTransactionsQuery["status"] | "all";
	onStatusChange: (value: AdminTransactionsQuery["status"] | "all") => void;
}

const TYPE_OPTIONS: { value: AdminTransactionsQuery["type"] | "all"; label: string }[] = [
	{ value: "all", label: "All types" },
	{ value: "deposit", label: "Deposit" },
	{ value: "withdrawal", label: "Withdrawal" },
	{ value: "internal_transfer", label: "Internal Transfer" },
	{ value: "conversion", label: "Conversion" },
	{ value: "withdrawal_ghs", label: "Withdrawal (GHS)" },
];

const STATUS_OPTIONS: { value: AdminTransactionsQuery["status"] | "all"; label: string }[] = [
	{ value: "all", label: "All statuses" },
	{ value: "pending", label: "Pending" },
	{ value: "processing", label: "Processing" },
	{ value: "completed", label: "Completed" },
	{ value: "failed", label: "Failed" },
	{ value: "reversed", label: "Reversed" },
];

function TransactionsFilters({
	search,
	onSearchChange,
	type,
	onTypeChange,
	status,
	onStatusChange,
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
					placeholder="Search by user or business ID"
					aria-label="Search transactions"
					className="pl-10"
				/>
			</div>

			<Select
				value={type}
				onChange={(e) => onTypeChange(e.target.value as AdminTransactionsQuery["type"] | "all")}
				aria-label="Filter by type"
				className="lg:w-48"
			>
				{TYPE_OPTIONS.map((option) => (
					<option key={option.value} value={option.value}>
						{option.label}
					</option>
				))}
			</Select>

			<Select
				value={status}
				onChange={(e) =>
					onStatusChange(e.target.value as AdminTransactionsQuery["status"] | "all")
				}
				aria-label="Filter by status"
				className="lg:w-40"
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

export { TransactionsFilters };
