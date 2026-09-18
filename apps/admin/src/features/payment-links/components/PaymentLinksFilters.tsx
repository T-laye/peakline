"use client";

import { Search } from "lucide-react";
import { Input } from "@repo/ui/input";
import { Select } from "@repo/ui/select";
import type { AdminPaymentLinksQuery } from "@/lib/api/types";

interface PaymentLinksFiltersProps {
	search: string;
	onSearchChange: (value: string) => void;
	status: AdminPaymentLinksQuery["status"] | "all";
	onStatusChange: (value: AdminPaymentLinksQuery["status"] | "all") => void;
}

const STATUS_OPTIONS: { value: AdminPaymentLinksQuery["status"] | "all"; label: string }[] = [
	{ value: "all", label: "All statuses" },
	{ value: "active", label: "Active" },
	{ value: "expired", label: "Expired" },
	{ value: "cancelled", label: "Cancelled" },
];

function PaymentLinksFilters({
	search,
	onSearchChange,
	status,
	onStatusChange,
}: PaymentLinksFiltersProps) {
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
					placeholder="Search by title"
					aria-label="Search payment links"
					className="pl-10"
				/>
			</div>

			<Select
				value={status}
				onChange={(e) =>
					onStatusChange(e.target.value as AdminPaymentLinksQuery["status"] | "all")
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

export { PaymentLinksFilters };
