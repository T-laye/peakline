"use client";

import { useState } from "react";
import Link from "next/link";
import { Download, Eye, Undo2 } from "lucide-react";
import { Button } from "@repo/ui/button";
import { EmptyState } from "@repo/ui/empty-state";
import { Input } from "@repo/ui/input";
import { Select } from "@repo/ui/select";
import { Skeleton } from "@repo/ui/skeleton";
import { cn } from "@repo/ui/lib/utils";
import { toast } from "@repo/ui/sonner";
import { Pagination } from "@/components/Pagination";
import {
	useEligiblePayments,
	useExportRefundsCsv,
	useRefunds,
	useRefundStats,
	type RefundsQuery,
} from "@/features/refunds/hooks";
import { formatUsdc } from "@/lib/currency";
import { shortAddress } from "@/lib/reconciliation";
import { getApiErrorMessage } from "@/lib/api/errorMessage";
import type { EligiblePaymentData, RefundData, RefundStatus } from "@/lib/api/types";
import {
	PaymentRefundPill,
	REFUND_STATUS_OPTIONS,
	RefundStatusPill,
	formatShortDate,
	shortId,
} from "./parts";

const PAGE_SIZE_OPTIONS = [10, 20, 50];
const usdc = (value: string) => `${formatUsdc(Number(value))} USDC`;

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
				<span className="text-h4 text-foreground sm:text-h3">{usdc(data.totalRefundedAmount)}</span>
			</div>
			<div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
				<StatCard label="Total refunds" value={data.total} />
				<StatCard label="Completed refunds" value={data.completed} />
				<StatCard label="Pending refunds" value={data.pending} />
				<StatCard label="Failed or cancelled" value={data.failed} />
			</div>
		</div>
	);
}

function EyeLink({ href, label }: { href: string; label: string }) {
	return (
		<Link
			href={href}
			aria-label={label}
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

function TableShell({ title, headings, children }: { title: string; headings: string[]; children: React.ReactNode }) {
	return (
		<div className="hidden overflow-hidden rounded-xl border border-border lg:block">
			<h2 className="px-5 py-4 text-b1 text-foreground">{title}</h2>
			<div className="overflow-x-auto">
				<table className="w-full border-collapse text-left">
					<thead>
						<tr className="bg-muted">
							{headings.map((heading) => (
								<th key={heading} className="p-4 text-label whitespace-nowrap text-muted-foreground">
									{heading}
								</th>
							))}
						</tr>
					</thead>
					<tbody>{children}</tbody>
				</table>
			</div>
		</div>
	);
}

const paymentLabel = (p: EligiblePaymentData) => p.reference ?? shortId(p.transactionId);
const payerLabel = (p: EligiblePaymentData) => p.customerReference ?? shortAddress(p.payerAddress);

/** c4 table: completed payments that still have something to refund. */
function EligiblePaymentsTable() {
	const [page, setPage] = useState(1);
	const [pageSize, setPageSize] = useState(10);
	const { data, isLoading } = useEligiblePayments(page, pageSize);

	if (isLoading || !data) return <Skeleton className="h-72 w-full rounded-xl" />;
	if (data.payments.length === 0) {
		return (
			<EmptyState
				icon={Undo2}
				title="No refundable payments"
				description="Completed payments with a refundable balance will show up here."
			/>
		);
	}

	return (
		<>
			<TableShell
				title="Refundable payments"
				headings={["Transaction ID", "Customer", "Amount (USDC)", "Payment Date", "Status", "Previously Refunded", "Remaining Refundable", "Action"]}
			>
				{data.payments.map((p) => (
					<tr key={p.transactionId} className="border-t border-border hover:bg-muted/50">
						<td className="p-4 text-b3 font-medium whitespace-nowrap text-foreground">#{paymentLabel(p)}</td>
						<td className="p-4 text-b3 whitespace-nowrap text-foreground">{payerLabel(p)}</td>
						<td className="p-4 text-b3 whitespace-nowrap text-foreground">{usdc(p.amount)}</td>
						<td className="p-4 text-b3 whitespace-nowrap text-foreground">{formatShortDate(p.completedAt)}</td>
						<td className="p-4">
							<PaymentRefundPill {...p.refundable} />
						</td>
						<td className="p-4 text-b3 whitespace-nowrap text-foreground">{usdc(p.refundable.refunded)}</td>
						<td className="p-4 text-b3 whitespace-nowrap text-foreground">{usdc(p.refundable.remaining)}</td>
						<td className="p-4">
							<EyeLink href={`/refunds/${p.transactionId}`} label={`Refund payment ${paymentLabel(p)}`} />
						</td>
					</tr>
				))}
			</TableShell>
			<div className="flex flex-col gap-3 lg:hidden">
				{data.payments.map((p) => (
					<div key={p.transactionId} className="flex flex-col gap-3 rounded-xl border border-border p-4">
						<CardRow label="Transaction ID" value={`#${paymentLabel(p)}`} />
						<CardRow label="Customer" value={payerLabel(p)} />
						<CardRow label="Amount" value={usdc(p.amount)} />
						<CardRow label="Remaining Refundable" value={usdc(p.refundable.remaining)} />
						<CardRow label="Status" value={<PaymentRefundPill {...p.refundable} />} />
						<div className="flex justify-end">
							<EyeLink href={`/refunds/${p.transactionId}`} label={`Refund payment ${paymentLabel(p)}`} />
						</div>
					</div>
				))}
			</div>
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
		</>
	);
}

const refundHref = (r: RefundData) => `/refunds/${r.originalTransactionId}/${r.id}`;

/** Every refund across the merchant's businesses, filterable by status/date. */
function RefundHistoryTable() {
	const [status, setStatus] = useState<RefundStatus | "all">("all");
	const [from, setFrom] = useState("");
	const [to, setTo] = useState("");
	const [page, setPage] = useState(1);
	const [pageSize, setPageSize] = useState(10);
	const query: RefundsQuery = {
		status: status === "all" ? undefined : status,
		from: from || undefined,
		to: to || undefined,
	};
	const { data, isLoading } = useRefunds(query, page, pageSize);
	const exportCsv = useExportRefundsCsv();

	function reset<T>(setter: (value: T) => void) {
		return (value: T) => {
			setter(value);
			setPage(1);
		};
	}

	return (
		<div className="flex flex-col gap-4">
			<div className="flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-center">
				<div className="hidden items-center gap-2 lg:flex">
					<span className="text-b3 text-muted-foreground">From</span>
					<Input type="date" value={from} onChange={(e) => reset(setFrom)(e.target.value)} aria-label="From date" className="lg:w-40" />
				</div>
				<div className="hidden items-center gap-2 lg:flex">
					<span className="text-b3 text-muted-foreground">To</span>
					<Input type="date" value={to} onChange={(e) => reset(setTo)(e.target.value)} aria-label="To date" className="lg:w-40" />
				</div>
				<Select
					value={status}
					onChange={(e) => reset(setStatus)(e.target.value as RefundStatus | "all")}
					aria-label="Filter by refund status"
					className="w-full lg:w-44"
				>
					<option value="all">All statuses</option>
					{REFUND_STATUS_OPTIONS.map((o) => (
						<option key={o.value} value={o.value}>
							{o.label}
						</option>
					))}
				</Select>
				<Button
					type="button"
					variant="outline"
					className="hidden lg:ml-auto lg:flex"
					loading={exportCsv.isPending}
					onClick={() =>
						exportCsv.mutate(
							{ from: from || undefined, to: to || undefined },
							{
								onSuccess: () => toast.success("Refund records exported"),
								onError: (error) => toast.error(getApiErrorMessage(error, "Couldn't export refunds")),
							},
						)
					}
				>
					<Download className="size-4" aria-hidden="true" />
					Export CSV
				</Button>
			</div>

			{isLoading || !data ? (
				<Skeleton className="h-72 w-full rounded-xl" />
			) : data.refunds.length === 0 ? (
				<EmptyState icon={Undo2} title="No refunds yet" description="Refunds you issue will show up here." />
			) : (
				<>
					<TableShell title="Refund history" headings={["Date", "Refund ID", "Amount (USDC)", "Reason", "Recipient", "Status", "Action"]}>
						{data.refunds.map((r) => (
							<tr key={r.id} className="border-t border-border hover:bg-muted/50">
								<td className="p-4 text-b3 whitespace-nowrap text-foreground">{formatShortDate(r.createdAt)}</td>
								<td className="p-4 text-b3 font-medium whitespace-nowrap text-foreground">{shortId(r.id)}</td>
								<td className="p-4 text-b3 whitespace-nowrap text-foreground">{usdc(r.amount)}</td>
								<td className="max-w-56 truncate p-4 text-b3 text-foreground">{r.reason}</td>
								<td className="p-4 text-b3 whitespace-nowrap text-foreground">{shortAddress(r.recipientAddress)}</td>
								<td className="p-4">
									<RefundStatusPill refund={r} />
								</td>
								<td className="p-4">
									<EyeLink href={refundHref(r)} label="View refund details" />
								</td>
							</tr>
						))}
					</TableShell>
					<div className="flex flex-col gap-3 lg:hidden">
						{data.refunds.map((r) => (
							<div key={r.id} className="flex flex-col gap-3 rounded-xl border border-border p-4">
								<CardRow label="Date" value={formatShortDate(r.createdAt)} />
								<CardRow label="Amount" value={usdc(r.amount)} />
								<CardRow label="Reason" value={<span className="line-clamp-1">{r.reason}</span>} />
								<CardRow label="Status" value={<RefundStatusPill refund={r} />} />
								<div className="flex justify-end">
									<EyeLink href={refundHref(r)} label="View refund details" />
								</div>
							</div>
						))}
					</div>
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
						itemsShown={data.refunds.length}
						total={data.meta.totalCount}
					/>
				</>
			)}
		</div>
	);
}

/** `/refunds` (c4). Two views over the real API: payments you can still
 * refund (the mock's table) and the full refund history. */
function RefundsList() {
	const [tab, setTab] = useState<"eligible" | "history">("eligible");

	return (
		<div className="flex flex-col gap-6">
			<RefundsStatsCards />

			<div className="flex flex-col gap-4">
				<div role="tablist" aria-label="Refund views" className="flex gap-1 self-start rounded-xl bg-muted p-1">
					{(
						[
							["eligible", "Refundable payments"],
							["history", "Refund history"],
						] as const
					).map(([value, label]) => (
						<button
							key={value}
							type="button"
							role="tab"
							aria-selected={tab === value}
							onClick={() => setTab(value)}
							className={cn(
								"rounded-lg px-4 py-2 text-b3 font-medium transition-colors",
								tab === value ? "bg-background text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground",
							)}
						>
							{label}
						</button>
					))}
				</div>
				{tab === "eligible" ? <EligiblePaymentsTable /> : <RefundHistoryTable />}
			</div>
		</div>
	);
}

export { RefundsList };
