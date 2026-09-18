"use client";

import { useState } from "react";
import { Building2, ShieldAlert } from "lucide-react";
import { Skeleton } from "@repo/ui/skeleton";
import { Badge } from "@repo/ui/badge";
import { Pagination } from "@/components/data/Pagination";
import { DataTable, type Column } from "@/components/data/DataTable";
import { BusinessesFilters } from "@/features/businesses/components/BusinessesFilters";
import { useAdminBusinesses } from "@/features/businesses/hooks";
import { formatDateTime } from "@/lib/format";
import type { AdminBusinessData, AdminBusinessesQuery } from "@/lib/api/types";

const PAGE_SIZE_OPTIONS = [10, 20, 50];

const STATUS_VARIANT: Record<AdminBusinessData["status"], "completed" | "pending" | "failed"> = {
	active: "completed",
	pending_verification: "pending",
	suspended: "failed",
};

const STATUS_LABEL: Record<AdminBusinessData["status"], string> = {
	active: "Active",
	pending_verification: "Pending Verification",
	suspended: "Suspended",
};

function ListSkeleton() {
	return (
		<div className="flex flex-col gap-4">
			<Skeleton className="h-11 w-full" />
			<Skeleton className="h-72 w-full rounded-xl" />
		</div>
	);
}

const COLUMNS: Column<AdminBusinessData>[] = [
	{ key: "name", label: "Business", render: (b) => b.name },
	{ key: "category", label: "Category", render: (b) => b.category },
	{ key: "country", label: "Country", render: (b) => b.country },
	{
		key: "status",
		label: "Status",
		render: (b) => <Badge variant={STATUS_VARIANT[b.status]}>{STATUS_LABEL[b.status]}</Badge>,
	},
	{ key: "createdAt", label: "Created", render: (b) => formatDateTime(b.createdAt) },
];

function BusinessesList() {
	const [search, setSearch] = useState("");
	const [status, setStatus] = useState<AdminBusinessesQuery["status"] | "all">("all");
	const [page, setPage] = useState(1);
	const [pageSize, setPageSize] = useState(20);

	const query: AdminBusinessesQuery = {
		q: search.trim() || undefined,
		status: status === "all" ? undefined : status,
	};
	const { data, isLoading, isError } = useAdminBusinesses(query, page, pageSize);

	function handleFilterChange<T>(setter: (value: T) => void) {
		return (value: T) => {
			setter(value);
			setPage(1);
		};
	}

	return (
		<div className="flex flex-col gap-4">
			<BusinessesFilters
				search={search}
				onSearchChange={handleFilterChange(setSearch)}
				status={status}
				onStatusChange={handleFilterChange(setStatus)}
			/>

			{isLoading || !data ? (
				<ListSkeleton />
			) : isError ? (
				<div className="rounded-2xl border border-border bg-background">
					<DataTable
						columns={COLUMNS}
						rows={[]}
						rowKey={(b) => b.id}
						emptyIcon={ShieldAlert}
						emptyTitle="Couldn't load businesses"
						emptyDescription="Something went wrong. Try refreshing."
					/>
				</div>
			) : (
				<>
					<DataTable
						columns={COLUMNS}
						rows={data.businesses}
						rowKey={(b) => b.id}
						getRowHref={(b) => `/businesses/${b.id}`}
						emptyIcon={Building2}
						emptyTitle="No businesses found"
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
							itemsShown={data.businesses.length}
							total={data.meta.totalCount}
						/>
					)}
				</>
			)}
		</div>
	);
}

export { BusinessesList };
