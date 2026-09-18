"use client";

import { Search } from "lucide-react";
import { Input } from "@repo/ui/input";
import { Select } from "@repo/ui/select";
import type { AdminBusinessesQuery } from "@/lib/api/types";

interface BusinessesFiltersProps {
	search: string;
	onSearchChange: (value: string) => void;
	status: AdminBusinessesQuery["status"] | "all";
	onStatusChange: (value: AdminBusinessesQuery["status"] | "all") => void;
}

function BusinessesFilters({ search, onSearchChange, status, onStatusChange }: BusinessesFiltersProps) {
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
					placeholder="Search by business name"
					aria-label="Search businesses"
					className="pl-10"
				/>
			</div>

			<Select
				value={status}
				onChange={(e) =>
					onStatusChange(e.target.value as AdminBusinessesQuery["status"] | "all")
				}
				aria-label="Filter by status"
				className="lg:w-48"
			>
				<option value="all">All statuses</option>
				<option value="active">Active</option>
				<option value="pending_verification">Pending Verification</option>
				<option value="suspended">Suspended</option>
			</Select>
		</div>
	);
}

export { BusinessesFilters };
