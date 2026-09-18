"use client";

import { useState } from "react";
import { Skeleton } from "@repo/ui/skeleton";
import { toast } from "@repo/ui/sonner";
import { Pagination } from "@/components/Pagination";
import {
	useExportPaymentLinksCsv,
	useMerchantPaymentLinks,
	type PaymentLinksQuery,
} from "@/features/merchant/hooks";
import { PaymentLinksStatsCards } from "@/features/merchant/components/PaymentLinksStatsCards";
import { PaymentLinksFilters } from "@/features/merchant/components/PaymentLinksFilters";
import { PaymentLinksTable } from "@/features/merchant/components/PaymentLinksTable";
import { getApiErrorMessage } from "@/lib/api/errorMessage";
import type { PaymentLinkStatus } from "@/lib/api/types";

const PAGE_SIZE_OPTIONS = [10, 20, 50];

function PaymentLinksListSkeleton() {
	return (
		<div className="flex flex-col gap-4">
			<Skeleton className="h-11 w-full" />
			<Skeleton className="h-72 w-full rounded-xl" />
		</div>
	);
}

/** `/payment-links`'s own list — filters/pagination are now sent to the
 * server (`GET /payment-links`'s own `q`/`status`/`from`/`to`/`page`/`limit`
 * params) rather than fetched once and sliced client-side, so every filter
 * or page change re-fetches. */
function PaymentLinksList() {
	const [search, setSearch] = useState("");
	const [from, setFrom] = useState("");
	const [to, setTo] = useState("");
	const [status, setStatus] = useState<PaymentLinkStatus | "all">("all");
	const [page, setPage] = useState(1);
	const [pageSize, setPageSize] = useState(10);

	const query: PaymentLinksQuery = {
		q: search.trim() || undefined,
		status: status === "all" ? undefined : status,
		from: from || undefined,
		to: to || undefined,
	};

	const { data, isLoading } = useMerchantPaymentLinks(query, page, pageSize);
	const exportCsv = useExportPaymentLinksCsv();

	// Debounced-free but still correct: any filter change resets to page 1,
	// mirroring the old client-side version's own `handleFilterChange`.
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
			onSuccess: () => toast.success("Payment links exported"),
			onError: (error) =>
				toast.error(getApiErrorMessage(error, "Couldn't export payment links")),
		});
	}

	return (
		<div className="flex flex-col gap-6">
			<PaymentLinksStatsCards />

			<div className="flex flex-col gap-4">
				<PaymentLinksFilters
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
					<PaymentLinksListSkeleton />
				) : (
					<>
						<PaymentLinksTable links={data.links} />
						{data.meta.totalCount > 0 && (
							<Pagination
								page={data.meta.currentPage}
								totalPages={data.meta.pageCount}
								pageSize={pageSize}
								onPageChange={setPage}
								onPageSizeChange={handlePageSizeChange}
								pageSizeOptions={PAGE_SIZE_OPTIONS}
								itemsShown={data.links.length}
								total={data.meta.totalCount}
							/>
						)}
					</>
				)}
			</div>
		</div>
	);
}

export { PaymentLinksList };
