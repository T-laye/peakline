"use client";

import { Search } from "lucide-react";
import { Input } from "@repo/ui/input";
import { Select } from "@repo/ui/select";
import type { AdminUsersQuery } from "@/lib/api/types";

interface UsersFiltersProps {
	search: string;
	onSearchChange: (value: string) => void;
	role: AdminUsersQuery["role"] | "all";
	onRoleChange: (value: AdminUsersQuery["role"] | "all") => void;
	customerType: AdminUsersQuery["customerType"] | "all";
	onCustomerTypeChange: (value: AdminUsersQuery["customerType"] | "all") => void;
	isLocked: AdminUsersQuery["isLocked"] | "all";
	onIsLockedChange: (value: AdminUsersQuery["isLocked"] | "all") => void;
}

function UsersFilters({
	search,
	onSearchChange,
	role,
	onRoleChange,
	customerType,
	onCustomerTypeChange,
	isLocked,
	onIsLockedChange,
}: UsersFiltersProps) {
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
					placeholder="Search by name or email"
					aria-label="Search users"
					className="pl-10"
				/>
			</div>

			<Select
				value={role}
				onChange={(e) => onRoleChange(e.target.value as AdminUsersQuery["role"] | "all")}
				aria-label="Filter by role"
				className="lg:w-40"
			>
				<option value="all">All roles</option>
				<option value="customer">Customer</option>
				<option value="staff">Staff</option>
			</Select>

			<Select
				value={customerType}
				onChange={(e) =>
					onCustomerTypeChange(e.target.value as AdminUsersQuery["customerType"] | "all")
				}
				aria-label="Filter by account type"
				className="lg:w-44"
			>
				<option value="all">All account types</option>
				<option value="individual">Individual</option>
				<option value="merchant">Merchant</option>
			</Select>

			<Select
				value={isLocked === "all" ? "all" : String(isLocked)}
				onChange={(e) =>
					onIsLockedChange(
						e.target.value === "all" ? "all" : (Number(e.target.value) as 0 | 1),
					)
				}
				aria-label="Filter by lock status"
				className="lg:w-36"
			>
				<option value="all">Any status</option>
				<option value="0">Not locked</option>
				<option value="1">Locked</option>
			</Select>
		</div>
	);
}

export { UsersFilters };
