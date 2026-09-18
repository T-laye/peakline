"use client";

import { useState } from "react";
import { Users as UsersIcon, ShieldAlert } from "lucide-react";
import { Skeleton } from "@repo/ui/skeleton";
import { Badge } from "@repo/ui/badge";
import { Pagination } from "@/components/data/Pagination";
import { DataTable, type Column } from "@/components/data/DataTable";
import { UsersFilters } from "@/features/users/components/UsersFilters";
import { useAdminUsers } from "@/features/users/hooks";
import { isCurrentlyLocked } from "@/features/users/utils";
import { formatDateTime } from "@/lib/format";
import type { AdminUserData, AdminUsersQuery } from "@/lib/api/types";

const PAGE_SIZE_OPTIONS = [10, 20, 50];

function ListSkeleton() {
	return (
		<div className="flex flex-col gap-4">
			<Skeleton className="h-11 w-full" />
			<Skeleton className="h-72 w-full rounded-xl" />
		</div>
	);
}

const COLUMNS: Column<AdminUserData>[] = [
	{
		key: "name",
		label: "Name",
		render: (user) => `${user.firstName} ${user.lastName}`,
	},
	{ key: "email", label: "Email", render: (user) => user.email },
	{
		key: "type",
		label: "Type",
		render: (user) =>
			user.role === "staff"
				? (user.staffRole ?? "Staff")
				: (user.customerType ?? "—"),
	},
	{
		key: "kyc",
		label: "KYC Tier",
		render: (user) => `Tier ${user.kycTier}`,
	},
	{
		key: "status",
		label: "Status",
		render: (user) =>
			isCurrentlyLocked(user) ? (
				<Badge variant="failed">Locked</Badge>
			) : (
				<Badge variant="completed">Active</Badge>
			),
	},
	{
		key: "createdAt",
		label: "Joined",
		render: (user) => formatDateTime(user.createdAt),
	},
];

function UsersList() {
	const [search, setSearch] = useState("");
	const [role, setRole] = useState<AdminUsersQuery["role"] | "all">("all");
	const [customerType, setCustomerType] = useState<AdminUsersQuery["customerType"] | "all">(
		"all",
	);
	const [isLocked, setIsLocked] = useState<AdminUsersQuery["isLocked"] | "all">("all");
	const [page, setPage] = useState(1);
	const [pageSize, setPageSize] = useState(20);

	const query: AdminUsersQuery = {
		q: search.trim() || undefined,
		role: role === "all" ? undefined : role,
		customerType: customerType === "all" ? undefined : customerType,
		isLocked: isLocked === "all" ? undefined : isLocked,
	};
	const { data, isLoading, isError } = useAdminUsers(query, page, pageSize);

	function handleFilterChange<T>(setter: (value: T) => void) {
		return (value: T) => {
			setter(value);
			setPage(1);
		};
	}

	return (
		<div className="flex flex-col gap-4">
			<UsersFilters
				search={search}
				onSearchChange={handleFilterChange(setSearch)}
				role={role}
				onRoleChange={handleFilterChange(setRole)}
				customerType={customerType}
				onCustomerTypeChange={handleFilterChange(setCustomerType)}
				isLocked={isLocked}
				onIsLockedChange={handleFilterChange(setIsLocked)}
			/>

			{isLoading || !data ? (
				<ListSkeleton />
			) : isError ? (
				<div className="rounded-2xl border border-border bg-background">
					<DataTable
						columns={COLUMNS}
						rows={[]}
						rowKey={(user) => user.id}
						emptyIcon={ShieldAlert}
						emptyTitle="Couldn't load users"
						emptyDescription="Something went wrong. Try refreshing."
					/>
				</div>
			) : (
				<>
					<DataTable
						columns={COLUMNS}
						rows={data.users}
						rowKey={(user) => user.id}
						getRowHref={(user) => `/users/${user.id}`}
						emptyIcon={UsersIcon}
						emptyTitle="No users found"
						emptyDescription="Nothing matches your current filters."
					/>
					{data.meta.totalCount > 0 && (
						<Pagination
							page={data.meta.currentPage}
							totalPages={data.meta.pageCount}
							pageSize={pageSize}
							onPageChange={setPage}
							onPageSizeChange={(size) => {
								setPageSize(size);
								setPage(1);
							}}
							pageSizeOptions={PAGE_SIZE_OPTIONS}
							itemsShown={data.users.length}
							total={data.meta.totalCount}
						/>
					)}
				</>
			)}
		</div>
	);
}

export { UsersList };
