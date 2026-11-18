"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ExternalLink, ShieldCheck } from "lucide-react";
import { Badge } from "@repo/ui/badge";
import { Button } from "@repo/ui/button";
import { EmptyState } from "@repo/ui/empty-state";
import { Input } from "@repo/ui/input";
import { Select } from "@repo/ui/select";
import { Skeleton } from "@repo/ui/skeleton";
import { toast } from "@repo/ui/sonner";
import { Pagination } from "@/components/Pagination";
import { useAxiosAuth } from "@/hooks/useAxiosAuth";
import { useResolveFlag } from "@/features/merchant/hooks";
import { apiRoutes } from "@/lib/config/apiRoutes";
import { describeFlagReason } from "@/lib/stellarIssues";
import { shortAddress } from "@/lib/reconciliation";
import { stellarExplorerUrl } from "@/lib/stellar";
import { formatUsdc } from "@/lib/currency";
import { formatTransactionDate } from "@/lib/transactions";
import { getApiErrorMessage } from "@/lib/api/errorMessage";
import type { ApiSuccessResponse, PaginationMeta, ReconciliationFlagData } from "@/lib/api/types";

type FlagState = "open" | "resolved" | "all";
const PAGE_SIZE_OPTIONS = [10, 20, 50];

function useFlags(state: FlagState, page: number, limit: number) {
	const axiosAuth = useAxiosAuth();
	return useQuery({
		queryKey: ["merchant", "reconciliation", "flags", state, page, limit],
		queryFn: async () => {
			const { data } = await axiosAuth.get<ApiSuccessResponse<ReconciliationFlagData[]> & { meta: PaginationMeta }>(
				apiRoutes.paymentLinks.FLAGS,
				{ params: { state, page, limit } },
			);
			return { flags: data.data, meta: data.meta };
		},
	});
}

function ResolveRow({ flag }: { flag: ReconciliationFlagData }) {
	const [note, setNote] = useState("");
	const resolve = useResolveFlag();

	return (
		<div className="flex flex-col gap-2 sm:flex-row">
			<Input
				value={note}
				onChange={(e) => setNote(e.target.value)}
				placeholder="Review note"
				aria-label="Review note"
				className="h-9"
			/>
			<Button
				type="button"
				size="small"
				variant="outline"
				className="shrink-0"
				disabled={note.trim().length < 3}
				loading={resolve.isPending}
				onClick={() =>
					resolve.mutate(
						{ flagId: flag.id, note: note.trim() },
						{
							onSuccess: () => toast.success("Marked as reviewed"),
							onError: (error) => toast.error(getApiErrorMessage(error, "Couldn't resolve this flag")),
						},
					)
				}
			>
				Mark reviewed
			</Button>
		</div>
	);
}

/** Payments to your wallets that couldn't be matched cleanly — wrong amount,
 * missing/unknown memo, late, duplicate, wrong asset... (`reason`). Money
 * is credited unless the asset/issuer was wrong (`transactionId` set =
 * credited). Resolving records a note; a flagged request returns to
 * pending once its last open flag is resolved. */
function FlaggedPaymentsList() {
	const [state, setState] = useState<FlagState>("open");
	const [page, setPage] = useState(1);
	const [pageSize, setPageSize] = useState(10);
	const { data, isLoading } = useFlags(state, page, pageSize);

	return (
		<div className="flex flex-col gap-4">
			<Select
				value={state}
				onChange={(e) => {
					setState(e.target.value as FlagState);
					setPage(1);
				}}
				aria-label="Filter flags"
				className="w-44"
			>
				<option value="open">Needs review</option>
				<option value="resolved">Reviewed</option>
				<option value="all">All</option>
			</Select>

			{isLoading || !data ? (
				<Skeleton className="h-60 w-full rounded-xl" />
			) : data.flags.length === 0 ? (
				<EmptyState
					icon={ShieldCheck}
					title={state === "open" ? "Nothing needs review" : "No flagged payments"}
					description="Payments that can't be matched to a request automatically will show up here."
				/>
			) : (
				<>
					<div className="flex flex-col gap-3">
						{data.flags.map((flag) => (
							<div key={flag.id} className="flex flex-col gap-3 rounded-xl border border-border p-4">
								<div className="flex flex-wrap items-start justify-between gap-3">
									<div className="flex min-w-0 flex-col gap-0.5">
										<span className="text-b2 font-semibold text-foreground">
											{formatUsdc(Number(flag.amount))} {flag.assetCode ?? "USDC"}
										</span>
										<span className="text-b3 text-foreground">{describeFlagReason(flag.reason)}</span>
										<span className="text-c1 text-muted-foreground">
											{formatTransactionDate(flag.createdAt)}
											{flag.fromAddress ? ` · from ${shortAddress(flag.fromAddress)}` : ""}
										</span>
									</div>
									<div className="flex flex-wrap items-center gap-2">
										<Badge variant={flag.transactionId ? "completed" : "failed"}>
											{flag.transactionId ? "Credited" : "Not credited"}
										</Badge>
										<Badge variant={flag.resolvedAt ? "cancelled" : "pending"}>
											{flag.resolvedAt ? "Reviewed" : "Needs review"}
										</Badge>
										<a
											href={stellarExplorerUrl(flag.stellarTxHash)}
											target="_blank"
											rel="noopener noreferrer"
											className="inline-flex items-center gap-1 text-c1 font-medium text-info-600 hover:underline"
										>
											Explorer <ExternalLink className="size-3" aria-hidden="true" />
										</a>
									</div>
								</div>
								{flag.resolvedAt ? (
									flag.note && <p className="text-c1 text-muted-foreground">Note: {flag.note}</p>
								) : (
									<ResolveRow flag={flag} />
								)}
							</div>
						))}
					</div>
					<Pagination
						page={data.meta.currentPage}
						totalPages={Math.max(1, data.meta.pageCount)}
						pageSize={pageSize}
						onPageChange={setPage}
						onPageSizeChange={(value) => {
							setPageSize(value);
							setPage(1);
						}}
						pageSizeOptions={PAGE_SIZE_OPTIONS}
						itemsShown={data.flags.length}
						total={data.meta.totalCount}
					/>
				</>
			)}
		</div>
	);
}

export { FlaggedPaymentsList };
