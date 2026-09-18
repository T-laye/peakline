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
import { PaymentsFilters } from "@/features/merchant/components/PaymentsFilters";
import { PaymentsTable } from "@/features/merchant/components/PaymentsTable";
import { getApiErrorMessage } from "@/lib/api/errorMessage";
import type { TransactionLedgerStatus } from "@/lib/api/types";

const PAGE_SIZE_OPTIONS = [10, 20, 50];

function PaymentsListSkeleton() {
	return (
		<div className="flex flex-col gap-4">
			<Skeleton className="h-11 w-full" />
			<Skeleton className="h-72 w-full rounded-xl" />
		</div>
	);
}

/** The Payments page's own list — "all incoming customer payments", the
 * same shared `useTransactions` as the general `/transactions` ledger but
 * with `direction: "incoming"` fixed into every query this list ever sends
 * (not a user-facing filter — this page simply never shows outgoing rows).
 * Real CSV export and server-side pagination, same shape as
 * `TransactionsList`. */
function PaymentsList() {
	const [search, setSearch] = useState("");
	const [from, setFrom] = useState("");
	const [to, setTo] = useState("");
	const [status, setStatus] = useState<TransactionLedgerStatus | "all">("all");
	const [page, setPage] = useState(1);
	const [pageSize, setPageSize] = useState(10);

	const query: TransactionsQuery = {
		direction: "incoming",
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
			onSuccess: () => toast.success("Payments exported"),
			onError: (error) => toast.error(getApiErrorMessage(error, "Couldn't export payments")),
		});
	}

	return (
		<div className="flex flex-col gap-4">
			<PaymentsFilters
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
				<PaymentsListSkeleton />
			) : (
				<>
					<PaymentsTable payments={data.transactions} />
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

export { PaymentsList };
