"use client";

import { Download, Search } from "lucide-react";
import { Button } from "@repo/ui/button";
import { Input } from "@repo/ui/input";
import { Select } from "@repo/ui/select";
import { RECONCILIATION_STATUS_BADGE, RECONCILIATION_TYPE_LABEL } from "@/lib/reconciliation";
import type { ReconciliationStatus, ReconciliationTransactionType } from "@/lib/api/types";

interface ReconciliationFiltersProps {
	search: string;
	onSearchChange: (value: string) => void;
	from: string;
	onFromChange: (value: string) => void;
	to: string;
	onToChange: (value: string) => void;
	status: ReconciliationStatus | "all";
	onStatusChange: (value: ReconciliationStatus | "all") => void;
	type: ReconciliationTransactionType | "all";
	onTypeChange: (value: ReconciliationTransactionType | "all") => void;
	onExport: () => void;
	exporting?: boolean;
}

/** Search is server-side now (`q` covers references, customer fields and the
 * Stellar hash). Mobile keeps search + status only, like the other lists. */
function ReconciliationFilters({
	search,
	onSearchChange,
	from,
	onFromChange,
	to,
	onToChange,
	status,
	onStatusChange,
	type,
	onTypeChange,
	onExport,
	exporting,
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
					placeholder="Search by reference, customer or hash"
					aria-label="Search reconciliation records"
					className="pl-10"
				/>
			</div>

			<div className="hidden items-center gap-2 lg:flex">
				<span className="text-b3 text-muted-foreground">From</span>
				<Input type="date" value={from} onChange={(e) => onFromChange(e.target.value)} aria-label="From date" className="lg:w-40" />
			</div>

			<div className="hidden items-center gap-2 lg:flex">
				<span className="text-b3 text-muted-foreground">To</span>
				<Input type="date" value={to} onChange={(e) => onToChange(e.target.value)} aria-label="To date" className="lg:w-40" />
			</div>

			<Select
				value={type}
				onChange={(e) => onTypeChange(e.target.value as ReconciliationTransactionType | "all")}
				aria-label="Filter by record type"
				className="hidden w-44 lg:flex"
			>
				<option value="all">All types</option>
				{(Object.keys(RECONCILIATION_TYPE_LABEL) as ReconciliationTransactionType[]).map((value) => (
					<option key={value} value={value}>
						{RECONCILIATION_TYPE_LABEL[value]}
					</option>
				))}
			</Select>

			<Select
				value={status}
				onChange={(e) => onStatusChange(e.target.value as ReconciliationStatus | "all")}
				aria-label="Filter by reconciliation status"
				className="w-40 lg:w-44"
			>
				<option value="all">All statuses</option>
				{(Object.keys(RECONCILIATION_STATUS_BADGE) as ReconciliationStatus[]).map((value) => (
					<option key={value} value={value}>
						{RECONCILIATION_STATUS_BADGE[value].label}
					</option>
				))}
			</Select>

			<Button type="button" variant="outline" onClick={onExport} loading={exporting} className="hidden lg:flex">
				<Download className="size-4" aria-hidden="true" />
				Export CSV
			</Button>
		</div>
	);
}

export { ReconciliationFilters };
