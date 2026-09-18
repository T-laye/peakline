"use client";

import { useState } from "react";
import Link from "next/link";
import { Receipt } from "lucide-react";
import { StatusBadge } from "@repo/ui/badge";
import { Skeleton } from "@repo/ui/skeleton";
import { EmptyState } from "@repo/ui/empty-state";
import { Pagination } from "@/components/Pagination";
import { useTransactions } from "@/features/transactions/hooks";
import {
	METHOD_LABEL,
	transactionCounterpartyLabel,
	transactionTitle,
	formatTransactionAmount,
	formatTransactionDate,
} from "@/lib/transactions";
import type { TransactionData } from "@/lib/api/types";

function RecentPaymentsSkeleton() {
	return (
		<div className="flex flex-col gap-3">
			{Array.from({ length: 4 }, (_, i) => (
				<Skeleton key={i} className="h-16 w-full rounded-xl" />
			))}
		</div>
	);
}

function CardRow({ label, value }: { label: string; value: React.ReactNode }) {
	return (
		<div className="flex items-center justify-between gap-4">
			<span className="text-c1 text-muted-foreground">{label}</span>
			<span className="text-b3 font-medium text-foreground">{value}</span>
		</div>
	);
}

function customerLabel(payment: TransactionData) {
	return transactionCounterpartyLabel(payment) ?? transactionTitle(payment);
}

/**
 * Overview's "Recent Payments" — a real table on desktop (Customer, Amount,
 * Method, Status, Date — a different column order than `PaymentsTable`'s
 * own, matching this section's own mock exactly), stacked cards on mobile
 * (per the mock's own dedicated mobile layout, rather than `PaymentsTable`'s
 * horizontal-scroll fallback — a nicer treatment worth using here since a
 * mock actually specifies it). Real server-side pagination now (page + page
 * size both refetch), same `direction: "incoming"`-fixed query
 * `PaymentsList` uses.
 */
function RecentPaymentsSection() {
	const [page, setPage] = useState(1);
	const [pageSize, setPageSize] = useState(10);
	const { data } = useTransactions({ direction: "incoming" }, page, pageSize);

	function handlePageSizeChange(value: number) {
		setPageSize(value);
		setPage(1);
	}

	return (
		<div className="flex flex-col gap-4">
			<div className="flex items-center justify-between">
				<h2 className="text-s1 text-foreground sm:text-h5">Recent Payments</h2>
				<Link
					href="/payments"
					className="text-c2 font-medium text-primary hover:underline sm:text-b3"
				>
					View all
				</Link>
			</div>

			{!data ? (
				<RecentPaymentsSkeleton />
			) : data.transactions.length === 0 ? (
				<EmptyState
					icon={Receipt}
					title="No payments yet"
					description="Payments from your customers will show up here once they come in."
				/>
			) : (
				<>
					<div className="hidden overflow-x-auto rounded-xl border border-border lg:block">
						<table className="w-full border-collapse text-left">
							<thead>
								<tr className="bg-muted">
									<th className="p-4 text-label text-muted-foreground">Customer</th>
									<th className="p-4 text-label text-muted-foreground">Amount (USDC)</th>
									<th className="p-4 text-label text-muted-foreground">Method</th>
									<th className="p-4 text-label text-muted-foreground">Status</th>
									<th className="p-4 text-label text-muted-foreground">Date</th>
								</tr>
							</thead>
							<tbody>
								{data.transactions.map((payment) => (
									<tr key={payment.id} className="border-t border-border">
										<td className="p-4 text-b3 text-foreground">
											{customerLabel(payment)}
										</td>
										<td className="p-4 text-b3 font-semibold text-success">
											{formatTransactionAmount(payment)}
										</td>
										<td className="p-4 text-b3 text-foreground">
											{payment.method ? METHOD_LABEL[payment.method] : "—"}
										</td>
										<td className="p-4">
											<StatusBadge status={payment.status} />
										</td>
										<td className="p-4 text-b3 text-foreground">
											{formatTransactionDate(payment.completedAt ?? payment.createdAt)}
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>

					<div className="flex flex-col gap-3 lg:hidden">
						{data.transactions.map((payment) => (
							<div
								key={payment.id}
								className="flex flex-col gap-3 rounded-xl border border-border p-4"
							>
								<CardRow label="Customer" value={customerLabel(payment)} />
								<CardRow
									label="Amount (USDC)"
									value={
										<span className="font-semibold text-success">
											{formatTransactionAmount(payment)}
										</span>
									}
								/>
								<CardRow
									label="Method"
									value={payment.method ? METHOD_LABEL[payment.method] : "—"}
								/>
								<CardRow label="Status" value={<StatusBadge status={payment.status} />} />
								<CardRow
									label="Date"
									value={formatTransactionDate(payment.completedAt ?? payment.createdAt)}
								/>
							</div>
						))}
					</div>

					<Pagination
						page={data.meta.currentPage}
						totalPages={data.meta.pageCount}
						pageSize={pageSize}
						onPageChange={setPage}
						onPageSizeChange={handlePageSizeChange}
						itemsShown={data.transactions.length}
						total={data.meta.totalCount}
					/>
				</>
			)}
		</div>
	);
}

export { RecentPaymentsSection };
