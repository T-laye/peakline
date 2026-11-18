"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Skeleton } from "@repo/ui/skeleton";
import { toast } from "@repo/ui/sonner";
import { Pagination } from "@/components/Pagination";
import {
	useExportPaymentRequestsCsv,
	usePaymentRequests,
	type PaymentRequestsQuery,
} from "@/features/payment-requests/hooks";
import { getApiErrorMessage } from "@/lib/api/errorMessage";
import type { PaymentLinkStatus as PaymentRequestStatus } from "@/lib/api/types";
import { PaymentRequestsStatsCards } from "./PaymentRequestsStatsCards";
import { PaymentRequestsFilters } from "./PaymentRequestsFilters";
import { PaymentRequestsTable } from "./PaymentRequestsTable";

const PAGE_SIZE_OPTIONS = [10, 20, 50];

/** `/payment-requests` — same structure as `PaymentLinksList`. */
function PaymentRequestsList() {
	// `?q=` lets other screens (e.g. Customers) open this list pre-filtered.
	const searchParams = useSearchParams();
	const [search, setSearch] = useState(() => searchParams.get("q") ?? "");
	const [from, setFrom] = useState("");
	const [to, setTo] = useState("");
	const [status, setStatus] = useState<PaymentRequestStatus | "all">("all");
	const [page, setPage] = useState(1);
	const [pageSize, setPageSize] = useState(10);

	const query: PaymentRequestsQuery = {
		q: search.trim() || undefined,
		status: status === "all" ? undefined : status,
		from: from || undefined,
		to: to || undefined,
	};

	const { data, isLoading } = usePaymentRequests(query, page, pageSize);
	const exportCsv = useExportPaymentRequestsCsv();

	function handleFilterChange<T>(setter: (value: T) => void) {
		return (value: T) => {
			setter(value);
			setPage(1);
		};
	}

	function handleExport() {
		exportCsv.mutate(query, {
			onSuccess: () => toast.success("Payment requests exported"),
			onError: (error) =>
				toast.error(getApiErrorMessage(error, "Couldn't export payment requests")),
		});
	}

	return (
		<div className="flex flex-col gap-6">
			<PaymentRequestsStatsCards />

			<div className="flex flex-col gap-4">
				<PaymentRequestsFilters
					search={search}
					onSearchChange={handleFilterChange(setSearch)}
					from={from}
					onFromChange={handleFilterChange(setFrom)}
					to={to}
					onToChange={handleFilterChange(setTo)}
					status={status}
					onStatusChange={handleFilterChange(setStatus)}
					onExport={handleExport}
					exporting={exportCsv.isPending}
				/>

				{isLoading || !data ? (
					<div className="flex flex-col gap-4">
						<Skeleton className="h-11 w-full" />
						<Skeleton className="h-72 w-full rounded-xl" />
					</div>
				) : (
					<>
						<PaymentRequestsTable requests={data.requests} />
						{data.meta.totalCount > 0 && (
							<Pagination
								page={data.meta.currentPage}
								totalPages={data.meta.pageCount}
								pageSize={pageSize}
								onPageChange={setPage}
								onPageSizeChange={(value) => {
									setPageSize(value);
									setPage(1);
								}}
								pageSizeOptions={PAGE_SIZE_OPTIONS}
								itemsShown={data.requests.length}
								total={data.meta.totalCount}
							/>
						)}
					</>
				)}
			</div>
		</div>
	);
}

export { PaymentRequestsList };
