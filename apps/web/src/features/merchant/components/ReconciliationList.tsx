"use client";

import { useState } from "react";
import { Skeleton } from "@repo/ui/skeleton";
import { Pagination } from "@/components/Pagination";
import { useReconciliation } from "@/features/merchant/hooks";
import { ReconciliationSummaryCards } from "@/features/merchant/components/ReconciliationSummaryCards";
import { ReconciliationFilters } from "@/features/merchant/components/ReconciliationFilters";
import { ReconciliationTable } from "@/features/merchant/components/ReconciliationTable";
import { reconciliationRequestId } from "@/lib/reconciliation";
import type { ReconciliationQuery, ReconciliationStatus } from "@/lib/api/types";

const PAGE_SIZE_OPTIONS = [10, 20, 50];

function ListSkeleton() {
	return (
		<div className="flex flex-col gap-4">
			<Skeleton className="h-11 w-full" />
			<Skeleton className="h-72 w-full rounded-xl" />
		</div>
	);
}

/**
 * Reconciliation's own list — summary cards + filters + table, all real
 * (`GET /merchant/reconciliation` + `/summary`, both confirmed live). The
 * "Search by ID" box is client-side only, filtering the current page's own
 * rows by request id/memo — the real endpoint has no `q`/search param
 * (confirmed: only `status`/`from`/`to`/`page`/`limit`), same limitation
 * `TransactionFilters` already had before a real search endpoint existed
 * for transactions.
 */
function ReconciliationList() {
	const [search, setSearch] = useState("");
	const [from, setFrom] = useState("");
	const [to, setTo] = useState("");
	const [status, setStatus] = useState<ReconciliationStatus | "all">("all");
	const [page, setPage] = useState(1);
	const [pageSize, setPageSize] = useState(10);

	const query: ReconciliationQuery = {
		status: status === "all" ? undefined : status,
		from: from || undefined,
		to: to || undefined,
	};
	const { data, isLoading } = useReconciliation(query, page, pageSize);

	const trimmedSearch = search.trim().toLowerCase();
	const records = trimmedSearch
		? (data?.records.filter((record) =>
				(reconciliationRequestId(record) ?? record.transactionId)
					.toLowerCase()
					.includes(trimmedSearch),
			) ?? [])
		: (data?.records ?? []);

	function handleFilterChange<T>(setter: (value: T) => void) {
		return (value: T) => {
			setter(value);
			setPage(1);
		};
	}

	function handlePageSizeChange(value: number) {
		setPageSize(value);
		setPage(1);
	}

	return (
		<div className="flex flex-col gap-6">
			<ReconciliationSummaryCards />

			<div className="flex flex-col gap-4">
				<ReconciliationFilters
					search={search}
					onSearchChange={setSearch}
					from={from}
					onFromChange={handleFilterChange(setFrom)}
					to={to}
					onToChange={handleFilterChange(setTo)}
					status={status}
					onStatusChange={handleFilterChange(setStatus)}
				/>

				{isLoading || !data ? (
					<ListSkeleton />
				) : (
					<>
						<ReconciliationTable records={records} />
						{!trimmedSearch && data.meta.totalCount > 0 && (
							<Pagination
								page={data.meta.currentPage}
								totalPages={data.meta.pageCount}
								pageSize={pageSize}
								onPageChange={setPage}
								onPageSizeChange={handlePageSizeChange}
								pageSizeOptions={PAGE_SIZE_OPTIONS}
								itemsShown={data.records.length}
								total={data.meta.totalCount}
							/>
						)}
					</>
				)}
			</div>
		</div>
	);
}

export { ReconciliationList };
