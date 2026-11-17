"use client";

import { useState } from "react";
import Link from "next/link";
import { Download, Eye, Search, Undo2 } from "lucide-react";
import { Button } from "@repo/ui/button";
import { EmptyState } from "@repo/ui/empty-state";
import { Input } from "@repo/ui/input";
import { Select } from "@repo/ui/select";
import { Skeleton } from "@repo/ui/skeleton";
import { toast } from "@repo/ui/sonner";
import { Pagination } from "@/components/Pagination";
import {
	paymentRefundState,
	useExportRefundsCsv,
	useRefundablePayments,
	useRefundStats,
	type PaymentRefundState,
	type RefundsQuery,
} from "@/features/refunds/hooks";
import { formatUsdc } from "@/lib/currency";
import { getApiErrorMessage } from "@/lib/api/errorMessage";
import type { RefundablePaymentData } from "@/lib/api/types";
import { REFUND_STATE_OPTIONS, RefundStatePill, formatShortDate } from "./parts";

const PAGE_SIZE_OPTIONS = [10, 20, 50];

function StatCard({ label, value }: { label: string; value: number }) {
	return (
		<div className="flex flex-col gap-2 rounded-2xl border border-border bg-background p-5 sm:p-6">
			<span className="text-b3 text-muted-foreground">{label}</span>
			<span className="text-h4 text-foreground">{value}</span>
		</div>
	);
}

function RefundsStatsCards() {
	const { data } = useRefundStats();
	if (!data) {
		return (
			<div className="flex flex-col gap-4">
				<Skeleton className="h-32 w-full rounded-2xl" />
				<div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
					{Array.from({ length: 4 }, (_, i) => (
						<Skeleton key={i} className="h-28 w-full rounded-2xl" />
					))}
				</div>
			</div>
		);
	}
	return (
		<div className="flex flex-col gap-4">
			<div className="flex flex-col gap-2 rounded-2xl border border-border bg-background p-5 sm:gap-3 sm:p-6">
				<span className="text-b3 text-muted-foreground sm:text-b2">Total refunded value</span>
				<span className="text-h4 text-foreground sm:text-h3">
					{formatUsdc(Number(data.totalRefundedAmount))} USDC
				</span>
			</div>
			<div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
				<StatCard label="Total refunds" value={data.total} />
				<StatCard label="Completed refunds" value={data.completed} />
				<StatCard label="Pending refunds" value={data.pending} />
				<StatCard label="Failed refunds" value={data.failed} />
			</div>
		</div>
	);
}

function ViewLink({ payment }: { payment: RefundablePaymentData }) {
	return (
		<Link
			href={`/refunds/${payment.id}`}
			aria-label={`View payment ${payment.reference}`}
			className="flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
		>
			<Eye className="size-4" aria-hidden="true" />
		</Link>
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

const usdc = (value: string) => `${formatUsdc(Number(value))} USDC`;

function RefundHistoryTable({ payments }: { payments: RefundablePaymentData[] }) {
	if (payments.length === 0) {
		return (
			<EmptyState
				icon={Undo2}
				title="No payments to show"
				description="Nothing matches your current filters."
			/>
		);
	}

	return (
		<>
			<div className="hidden overflow-hidden rounded-xl border border-border lg:block">
				<h2 className="px-5 py-4 text-b1 text-foreground">Refund history</h2>
				<div className="overflow-x-auto">
					<table className="w-full border-collapse text-left">
						<thead>
							<tr className="bg-muted">
								{[
									"Transaction ID",
									"Customer",
									"Amount (USDC)",
									"Payment Date",
									"Status",
									"Previously Refunded",
									"Remaining Refundable",
									"Action",
								].map((heading) => (
									<th key={heading} className="p-4 text-label whitespace-nowrap text-muted-foreground">
										{heading}
									</th>
								))}
							</tr>
						</thead>
						<tbody>
							{payments.map((p) => (
								<tr key={p.id} className="border-t border-border hover:bg-muted/50">
									<td className="p-4 text-b3 font-medium whitespace-nowrap text-foreground">#{p.reference}</td>
									<td className="p-4 text-b3 whitespace-nowrap text-foreground">{p.customer.name}</td>
									<td className="p-4 text-b3 whitespace-nowrap text-foreground">{usdc(p.amount)}</td>
									<td className="p-4 text-b3 whitespace-nowrap text-foreground">{formatShortDate(p.paidAt)}</td>
									<td className="p-4">
										<RefundStatePill state={paymentRefundState(p)} />
									</td>
									<td className="p-4 text-b3 whitespace-nowrap text-foreground">{usdc(p.refundedAmount)}</td>
									<td className="p-4 text-b3 whitespace-nowrap text-foreground">{usdc(p.remainingRefundable)}</td>
									<td className="p-4">
										<ViewLink payment={p} />
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			</div>

			<div className="flex flex-col gap-3 lg:hidden">
				{payments.map((p) => (
					<div key={p.id} className="flex flex-col gap-3 rounded-xl border border-border p-4">
						<CardRow label="Transaction ID" value={`#${p.reference}`} />
						<CardRow label="Customer" value={p.customer.name} />
						<CardRow label="Amount" value={usdc(p.amount)} />
						<CardRow label="Remaining Refundable" value={usdc(p.remainingRefundable)} />
						<CardRow label="Status" value={<RefundStatePill state={paymentRefundState(p)} />} />
						<div className="flex justify-end">
							<ViewLink payment={p} />
						</div>
					</div>
				))}
			</div>
		</>
	);
}

/** `/refunds` (c4 mock). Each row is a verified payment with its refund
 * position — "Previously Refunded" counts completed refunds only, while
 * "Remaining Refundable" also holds back in-flight ones (brief: pending
 * refunds are reserved). The mock's status column showed "Paid/Expired";
 * expired requests can't have payments, so this shows the payment's refund
 * state instead. */
function RefundsList() {
	const [search, setSearch] = useState("");
	const [from, setFrom] = useState("");
	const [to, setTo] = useState("");
	const [state, setState] = useState<PaymentRefundState | "all">("all");
	const [page, setPage] = useState(1);
	const [pageSize, setPageSize] = useState(10);

	const query: RefundsQuery = {
		q: search.trim() || undefined,
		state: state === "all" ? undefined : state,
		from: from || undefined,
		to: to || undefined,
	};
	const { data, isLoading } = useRefundablePayments(query, page, pageSize);
	const exportCsv = useExportRefundsCsv();

	function reset<T>(setter: (value: T) => void) {
		return (value: T) => {
			setter(value);
			setPage(1);
		};
	}

	function handleExport() {
		exportCsv.mutate(query, {
			onSuccess: () => toast.success("Refund records exported"),
			onError: (error) => toast.error(getApiErrorMessage(error, "Couldn't export refunds")),
		});
	}

	return (
		<div className="flex flex-col gap-6">
			<RefundsStatsCards />

			<div className="flex flex-col gap-4">
				<div className="flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-center">
					<div className="relative flex-1 lg:min-w-48">
						<Search
							className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground"
							aria-hidden="true"
						/>
						<Input
							value={search}
							onChange={(e) => reset(setSearch)(e.target.value)}
							placeholder="Search by customer name"
							aria-label="Search refunds by customer name"
							className="pl-10"
						/>
					</div>
					<div className="hidden items-center gap-2 lg:flex">
						<span className="text-b3 text-muted-foreground">From</span>
						<Input type="date" value={from} onChange={(e) => reset(setFrom)(e.target.value)} aria-label="From payment date" className="lg:w-40" />
					</div>
					<div className="hidden items-center gap-2 lg:flex">
						<span className="text-b3 text-muted-foreground">To</span>
						<Input type="date" value={to} onChange={(e) => reset(setTo)(e.target.value)} aria-label="To payment date" className="lg:w-40" />
					</div>
					<div className="flex justify-end lg:contents">
						<Select
							value={state}
							onChange={(e) => reset(setState)(e.target.value as PaymentRefundState | "all")}
							aria-label="Filter by status"
							className="w-44"
						>
							<option value="all">All statuses</option>
							{REFUND_STATE_OPTIONS.map((o) => (
								<option key={o.value} value={o.value}>
									{o.label}
								</option>
							))}
						</Select>
					</div>
					<Button type="button" variant="outline" onClick={handleExport} loading={exportCsv.isPending} className="hidden lg:flex">
						<Download className="size-4" aria-hidden="true" />
						Export CSV
					</Button>
				</div>

				{isLoading || !data ? (
					<Skeleton className="h-72 w-full rounded-xl" />
				) : (
					<>
						<RefundHistoryTable payments={data.payments} />
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
								itemsShown={data.payments.length}
								total={data.meta.totalCount}
							/>
						)}
					</>
				)}
			</div>
		</div>
	);
}

export { RefundsList };
