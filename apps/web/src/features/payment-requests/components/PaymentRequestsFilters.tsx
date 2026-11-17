"use client";

import { Search, Download } from "lucide-react";
import { Input } from "@repo/ui/input";
import { Select } from "@repo/ui/select";
import { Button } from "@repo/ui/button";
import type { PaymentRequestStatus } from "@/lib/api/types";
import { PAYMENT_REQUEST_STATUS_OPTIONS } from "./PaymentRequestStatusPill";

interface PaymentRequestsFiltersProps {
	search: string;
	onSearchChange: (value: string) => void;
	from: string;
	onFromChange: (value: string) => void;
	to: string;
	onToChange: (value: string) => void;
	status: PaymentRequestStatus | "all";
	onStatusChange: (value: PaymentRequestStatus | "all") => void;
	onExport: () => void;
	exporting?: boolean;
}

/** Same bar as `PaymentLinksFilters` (mobile shows search + status only).
 * The mock's placeholder says "Search by title", but the table has no
 * title column — search covers customer, request ID and reference instead.
 * From/To bound the creation date. */
function PaymentRequestsFilters({
	search,
	onSearchChange,
	from,
	onFromChange,
	to,
	onToChange,
	status,
	onStatusChange,
	onExport,
	exporting,
}: PaymentRequestsFiltersProps) {
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
					placeholder="Search by customer, ID or reference"
					aria-label="Search payment requests"
					className="pl-10"
				/>
			</div>

			<div className="hidden items-center gap-2 lg:flex">
				<span className="text-b3 text-muted-foreground">From</span>
				<Input
					type="date"
					value={from}
					onChange={(e) => onFromChange(e.target.value)}
					aria-label="From creation date"
					className="lg:w-40"
				/>
			</div>

			<div className="hidden items-center gap-2 lg:flex">
				<span className="text-b3 text-muted-foreground">To</span>
				<Input
					type="date"
					value={to}
					onChange={(e) => onToChange(e.target.value)}
					aria-label="To creation date"
					className="lg:w-40"
				/>
			</div>

			<div className="flex justify-end lg:contents">
				<Select
					value={status}
					onChange={(e) => onStatusChange(e.target.value as PaymentRequestStatus | "all")}
					aria-label="Filter by status"
					className="w-40 lg:w-44"
				>
					<option value="all">All statuses</option>
					{PAYMENT_REQUEST_STATUS_OPTIONS.map((option) => (
						<option key={option.value} value={option.value}>
							{option.label}
						</option>
					))}
				</Select>
			</div>

			<Button
				type="button"
				variant="outline"
				onClick={onExport}
				loading={exporting}
				className="hidden lg:flex"
			>
				<Download className="size-4" aria-hidden="true" />
				Export CSV
			</Button>
		</div>
	);
}

export { PaymentRequestsFilters };
