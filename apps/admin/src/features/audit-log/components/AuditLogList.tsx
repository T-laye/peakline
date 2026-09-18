"use client";

import { useState } from "react";
import { ScrollText, ShieldAlert } from "lucide-react";
import { Skeleton } from "@repo/ui/skeleton";
import { Pagination } from "@/components/data/Pagination";
import { DataTable, type Column } from "@/components/data/DataTable";
import { AuditLogFilters } from "@/features/audit-log/components/AuditLogFilters";
import { useAdminAuditLog } from "@/features/audit-log/hooks";
import { formatDateTime } from "@/lib/format";
import type { AdminAuditLogEntryData, AdminAuditLogQuery } from "@/lib/api/types";

const PAGE_SIZE_OPTIONS = [20, 50, 100];

function ListSkeleton() {
	return (
		<div className="flex flex-col gap-4">
			<Skeleton className="h-11 w-full" />
			<Skeleton className="h-72 w-full rounded-xl" />
		</div>
	);
}

const COLUMNS: Column<AdminAuditLogEntryData>[] = [
	{ key: "action", label: "Action", render: (entry) => entry.action },
	{
		key: "resource",
		label: "Resource",
		render: (entry) => `${entry.resourceType}${entry.resourceId ? ` · ${entry.resourceId}` : ""}`,
	},
	{ key: "actor", label: "Actor", render: (entry) => entry.actorEmail ?? entry.actorId },
	{ key: "createdAt", label: "When", render: (entry) => formatDateTime(entry.createdAt) },
];

/** Read-only — no detail action link. An audit entry's `metadata` is the
 * only thing a detail page could add over this row, and the real response
 * shape for `GET /admin/audit-log/{id}` is unverified (see
 * `AdminAuditLogEntryData`'s own note) — revisit once that's confirmed
 * live rather than link to a guessed-at detail view now. */
function AuditLogList() {
	const [actorId, setActorId] = useState("");
	const [action, setAction] = useState("");
	const [resourceType, setResourceType] = useState("");
	const [page, setPage] = useState(1);
	const [pageSize, setPageSize] = useState(50);

	const query: AdminAuditLogQuery = {
		actorId: actorId.trim() || undefined,
		action: action.trim() || undefined,
		resourceType: resourceType.trim() || undefined,
	};
	const { data, isLoading, isError } = useAdminAuditLog(query, page, pageSize);

	function handleFilterChange(setter: (value: string) => void) {
		return (value: string) => {
			setter(value);
			setPage(1);
		};
	}

	return (
		<div className="flex flex-col gap-4">
			<AuditLogFilters
				actorId={actorId}
				onActorIdChange={handleFilterChange(setActorId)}
				action={action}
				onActionChange={handleFilterChange(setAction)}
				resourceType={resourceType}
				onResourceTypeChange={handleFilterChange(setResourceType)}
			/>

			{isLoading || !data ? (
				<ListSkeleton />
			) : isError ? (
				<div className="rounded-2xl border border-border bg-background">
					<DataTable
						columns={COLUMNS}
						rows={[]}
						rowKey={(entry) => entry.id}
						emptyIcon={ShieldAlert}
						emptyTitle="Couldn't load the audit log"
						emptyDescription="Something went wrong. Try refreshing."
					/>
				</div>
			) : (
				<>
					<DataTable
						columns={COLUMNS}
						rows={data.entries}
						rowKey={(entry) => entry.id}
						emptyIcon={ScrollText}
						emptyTitle="No audit entries found"
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
							itemsShown={data.entries.length}
							total={data.meta.totalCount}
						/>
					)}
				</>
			)}
		</div>
	);
}

export { AuditLogList };
