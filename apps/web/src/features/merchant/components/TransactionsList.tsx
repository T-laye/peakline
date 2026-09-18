"use client";

import { useState } from "react";
import { Skeleton } from "@repo/ui/skeleton";
import { toast } from "@repo/ui/sonner";
import { Pagination } from "@/components/Pagination";
import {
	useExportTransactionsCsv,
	useTransactions,
	type TransactionsQuery,
} from "@/features/transactions/hooks";
import { TransactionsFilters } from "@/features/merchant/components/TransactionsFilters";
import { TransactionsTable } from "@/features/merchant/components/TransactionsTable";
import { getApiErrorMessage } from "@/lib/api/errorMessage";
import type { TransactionLedgerStatus } from "@/lib/api/types";

const PAGE_SIZE_OPTIONS = [10, 20, 50];

function TransactionsListSkeleton() {
	return (
		<div className="flex flex-col gap-4">
			<Skeleton className="h-11 w-full" />
			<Skeleton className="h-72 w-full rounded-xl" />
		</div>
	);
}

/** Merchant's own `/transactions` list — same shape as `PaymentsList`
 * (search + date range + status filter, real CSV export, server-side
 * pagination), backed by the shared `useTransactions` with no `direction`
 * filter (unlike `PaymentsList`, which fixes it to `"incoming"`).
 * Individual keeps its own existing `TransactionHistoryList` untouched —
 * this only renders for a merchant session (see `transactions/page.tsx`'s
 * own branch). */
function TransactionsList() {
	const [search, setSearch] = useState("");
	const [from, setFrom] = useState("");
	const [to, setTo] = useState("");
	const [status, setStatus] = useState<TransactionLedgerStatus | "all">("all");
	const [page, setPage] = useState(1);
	const [pageSize, setPageSize] = useState(10);

	const query: TransactionsQuery = {
		q: search.trim() || undefined,
		status: status === "all" ? undefined : status,
		from: from || undefined,
		to: to || undefined,
	};
	const { data, isLoading } = useTransactions(query, page, pageSize);
	const exportCsv = useExportTransactionsCsv();

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

	function handleExport() {
		exportCsv.mutate(query, {
			onSuccess: () => toast.success("Transactions exported"),
			onError: (error) =>
				toast.error(getApiErrorMessage(error, "Couldn't export transactions")),
		});
	}

	return (
		<div className="flex flex-col gap-4">
			<TransactionsFilters
				search={search}
				onSearchChange={handleFilterChange(setSearch)}
				from={from}
				onFromChange={handleFilterChange(setFrom)}
				to={to}
				onToChange={handleFilterChange(setTo)}
				status={status}
				onStatusChange={handleFilterChange(setStatus)}
				onExport={handleExport}
			/>

			{isLoading || !data ? (
				<TransactionsListSkeleton />
			) : (
				<>
					<TransactionsTable transactions={data.transactions} />
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

export { TransactionsList };
