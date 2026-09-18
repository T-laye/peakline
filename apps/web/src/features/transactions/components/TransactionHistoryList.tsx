"use client";

import { useState } from "react";
import { ArrowLeftRight } from "lucide-react";
import { Skeleton } from "@repo/ui/skeleton";
import { EmptyState } from "@repo/ui/empty-state";
import { Pagination } from "@/components/Pagination";
import { useTransactions, type TransactionsQuery } from "@/features/transactions/hooks";
import { TransactionRow } from "@/features/transactions/components/TransactionRow";
import { TransactionFilters } from "@/features/transactions/components/TransactionFilters";
import type { TransactionLedgerStatus } from "@/lib/api/types";

const PAGE_SIZE_OPTIONS = [10, 20, 50];

function TransactionHistoryListSkeleton() {
	return (
		<div className="flex flex-col">
			{Array.from({ length: 6 }, (_, i) => (
				<div
					key={i}
					className="flex items-center gap-4 border-b border-border py-4 last:border-0"
				>
					<Skeleton className="size-9 shrink-0 rounded-full sm:size-11" />
					<div className="flex flex-1 flex-col gap-2">
						<Skeleton className="h-4 w-40 max-w-full" />
						<Skeleton className="h-3 w-24" />
					</div>
					<div className="flex flex-col items-end gap-2">
						<Skeleton className="h-4 w-20" />
						<Skeleton className="h-3 w-16" />
					</div>
				</div>
			))}
		</div>
	);
}

/** The `/transactions` page's own full history — the "view all" this page
 * exists to be, versus the dashboard's abbreviated latest few. Server-side
 * filtered/paginated now (`GET /transactions`'s own `q`/`status`/`page`/
 * `limit`) instead of filtering an already-fetched fake array — same shift
 * Payment Links' own list made once it got a real endpoint. */
function TransactionHistoryList() {
	const [search, setSearch] = useState("");
	const [status, setStatus] = useState<TransactionLedgerStatus | "all">("all");
	const [page, setPage] = useState(1);
	const [pageSize, setPageSize] = useState(10);

	const query: TransactionsQuery = {
		q: search.trim() || undefined,
		status: status === "all" ? undefined : status,
	};
	const { data, isLoading } = useTransactions(query, page, pageSize);

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
		<div className="flex flex-col gap-4">
			<TransactionFilters
				search={search}
				onSearchChange={handleFilterChange(setSearch)}
				status={status}
				onStatusChange={handleFilterChange(setStatus)}
			/>

			{isLoading || !data ? (
				<TransactionHistoryListSkeleton />
			) : data.transactions.length === 0 ? (
				<EmptyState
					icon={ArrowLeftRight}
					title="No transactions yet"
					description="Nothing matches your search, or your history is still empty — send, receive, or pay someone to get started."
				/>
			) : (
				<>
					<div className="flex flex-col">
						{data.transactions.map((transaction) => (
							<TransactionRow key={transaction.id} transaction={transaction} />
						))}
					</div>
					{data.meta.totalCount > 0 && (
						<Pagination
							page={data.meta.currentPage}
							totalPages={data.meta.pageCount}
							pageSize={pageSize}
							onPageChange={setPage}
							onPageSizeChange={handlePageSizeChange}
							pageSizeOptions={PAGE_SIZE_OPTIONS}
							itemsShown={data.transactions.length}
							total={data.meta.totalCount}
						/>
					)}
				</>
			)}
		</div>
	);
}

export { TransactionHistoryList };
