"use client";

import Link from "next/link";
import { Eye, Receipt } from "lucide-react";
import { StatusBadge } from "@repo/ui/badge";
import { EmptyState } from "@repo/ui/empty-state";
import {
	METHOD_LABEL,
	transactionCounterpartyLabel,
	transactionTitle,
	formatTransactionAmount,
	formatTransactionDate,
} from "@/lib/transactions";
import type { TransactionData } from "@/lib/api/types";

function CardRow({ label, value }: { label: string; value: React.ReactNode }) {
	return (
		<div className="flex items-center justify-between gap-4">
			<span className="text-c1 text-muted-foreground">{label}</span>
			<span className="text-b3 font-medium text-foreground">{value}</span>
		</div>
	);
}

/** "Customer" falls back to `transactionTitle` for the rare incoming row
 * with no identifiable counterparty at all (e.g. a straight deposit) —
 * every other real row here has a name/username/phone or an external
 * wallet address to show instead. */
function customerLabel(payment: TransactionData) {
	return transactionCounterpartyLabel(payment) ?? transactionTitle(payment);
}

/**
 * A real `<table>` on desktop — Customer, Amount, Method, Status, Date,
 * then a dedicated Action column with an eye icon linking to the payment's
 * own detail page, per the updated mock (replacing the earlier
 * whole-row-as-link treatment). Stacked cards on mobile, same field set,
 * with the eye icon pinned to each card's own bottom-right corner —
 * matching `RecentPaymentsSection`'s card convention so the two "same
 * shape of data, different page" lists don't drift stylistically apart.
 */
function PaymentsTable({ payments }: { payments: TransactionData[] }) {
	if (payments.length === 0) {
		return (
			<EmptyState
				icon={Receipt}
				title="No payments yet"
				description="Payments from your customers will show up here once they come in."
			/>
		);
	}

	return (
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
							<th className="p-4 text-label text-muted-foreground">Action</th>
						</tr>
					</thead>
					<tbody>
						{payments.map((payment) => (
							<tr key={payment.id} className="border-t border-border hover:bg-muted/50">
								<td className="p-4 text-b3 text-foreground">{customerLabel(payment)}</td>
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
								<td className="p-4">
									<Link
										href={`/payments/${payment.id}`}
										aria-label={`View payment from ${customerLabel(payment)}`}
										className="flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
									>
										<Eye className="size-4" aria-hidden="true" />
									</Link>
								</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>

			<div className="flex flex-col gap-3 lg:hidden">
				{payments.map((payment) => (
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
						<div className="flex justify-end">
							<Link
								href={`/payments/${payment.id}`}
								aria-label={`View payment from ${customerLabel(payment)}`}
								className="flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
							>
								<Eye className="size-4" aria-hidden="true" />
							</Link>
						</div>
					</div>
				))}
			</div>
		</>
	);
}

export { PaymentsTable };
