"use client";

import { Search, Download } from "lucide-react";
import { Input } from "@repo/ui/input";
import { Select } from "@repo/ui/select";
import { Button } from "@repo/ui/button";
import type { PaymentLinkStatus } from "@/lib/api/types";

const STATUS_OPTIONS: { value: PaymentLinkStatus | "all"; label: string }[] = [
	{ value: "all", label: "All statuses" },
	{ value: "active", label: "Active" },
	{ value: "expired", label: "Expired" },
	{ value: "cancelled", label: "Cancelled" },
];

interface PaymentLinksFiltersProps {
	search: string;
	onSearchChange: (value: string) => void;
	from: string;
	onFromChange: (value: string) => void;
	to: string;
	onToChange: (value: string) => void;
	status: PaymentLinkStatus | "all";
	onStatusChange: (value: PaymentLinkStatus | "all") => void;
	onExport: () => void;
}

/** Same filter bar shape as `PaymentsFilters` (including its mobile-compact
 * treatment — Search + status only there, From/To/Export CSV moving to
 * `lg`) — kept as its own component rather than a shared generic one since
 * the two status vocabularies genuinely differ (a payment link's lifecycle
 * isn't a payment's). Filters on title, not customer name — payment links
 * aren't tied to a payer until someone actually pays them. From/To bound the
 * link's *creation* date (matching what the real `GET /payment-links`
 * endpoint actually filters `from`/`to` on), not its expiration. */
function PaymentLinksFilters({
	search,
	onSearchChange,
	from,
	onFromChange,
	to,
	onToChange,
	status,
	onStatusChange,
	onExport,
}: PaymentLinksFiltersProps) {
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
					placeholder="Search by payment title"
					aria-label="Search payment links by title"
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
					onChange={(e) => onStatusChange(e.target.value as PaymentLinkStatus | "all")}
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

export { PaymentLinksFilters };
