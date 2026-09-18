"use client";

import { Select } from "@repo/ui/select";
import type { StaffRole } from "@/lib/api/types";

interface StaffFiltersProps {
	staffRole: StaffRole | "all";
	onStaffRoleChange: (value: StaffRole | "all") => void;
}

const ROLE_OPTIONS: { value: StaffRole | "all"; label: string }[] = [
	{ value: "all", label: "All roles" },
	{ value: "super_admin", label: "Super admin" },
	{ value: "admin", label: "Admin" },
	{ value: "support", label: "Support" },
	{ value: "compliance", label: "Compliance" },
	{ value: "operations", label: "Operations" },
];

/** No search box — `GET /admin/staff` has no free-text `q` param, unlike
 * Users; only `staffRole` filters this list. */
function StaffFilters({ staffRole, onStaffRoleChange }: StaffFiltersProps) {
	return (
		<div className="flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-center">
			<Select
				value={staffRole}
				onChange={(e) => onStaffRoleChange(e.target.value as StaffRole | "all")}
				aria-label="Filter by staff role"
				className="lg:w-48"
			>
				{ROLE_OPTIONS.map((option) => (
					<option key={option.value} value={option.value}>
						{option.label}
					</option>
				))}
			</Select>
		</div>
	);
}

export { StaffFilters };
