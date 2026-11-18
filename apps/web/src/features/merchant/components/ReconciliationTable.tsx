"use client";

import Link from "next/link";
import { Eye, GitCompareArrows } from "lucide-react";
import { Badge } from "@repo/ui/badge";
import { EmptyState } from "@repo/ui/empty-state";
import { cn } from "@repo/ui/lib/utils";
import {
	RECONCILIATION_STATUS_BADGE,
	RECONCILIATION_TYPE_LABEL,
	reconciliationCustomerLabel,
} from "@/lib/reconciliation";
import { formatTransactionDate } from "@/lib/transactions";
import { formatUsdc } from "@/lib/currency";
import type { ReconciliationData } from "@/lib/api/types";

function StatusPill({ record }: { record: ReconciliationData }) {
	const badge = RECONCILIATION_STATUS_BADGE[record.reconciliationStatus];
	return (
		<Badge variant={badge.variant}>
			<span className={cn("size-1.5 rounded-full", badge.dot)} aria-hidden="true" />
			{badge.label}
		</Badge>
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

function ViewLink({ record }: { record: ReconciliationData }) {
	return (
		<Link
			href={`/reconciliation/${record.reference}`}
			aria-label="View reconciliation details"
			className="flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
		>
			<Eye className="size-4" aria-hidden="true" />
		</Link>
	);
}

const amountLabel = (record: ReconciliationData) =>
	`${record.transactionType === "refund" ? "−" : ""}${formatUsdc(Number(record.amount))} ${record.asset}`;

/** v3 records cover payments, refunds and uncredited (flagged) payments, so
 * the table shows the record type and the request reference (PK-...) when
 * the payment settled a request. */
function ReconciliationTable({ records }: { records: ReconciliationData[] }) {
	if (records.length === 0) {
		return (
			<EmptyState
				icon={GitCompareArrows}
				title="Nothing to reconcile yet"
				description="Payments, refunds and flagged payments to your businesses will show up here."
			/>
		);
	}

	return (
		<>
			<div className="hidden overflow-x-auto rounded-xl border border-border lg:block">
				<table className="w-full border-collapse text-left">
					<thead>
						<tr className="bg-muted">
							{["Request ID", "Customer", "Type", "Amount", "Date", "Reconciliation Status", "Action"].map(
								(heading) => (
									<th key={heading} className="p-4 text-label whitespace-nowrap text-muted-foreground">
										{heading}
									</th>
								),
							)}
						</tr>
					</thead>
					<tbody>
						{records.map((record) => (
							<tr key={record.reference} className="border-t border-border hover:bg-muted/50">
								<td className="p-4 text-b3 whitespace-nowrap text-foreground">{record.paymentReference ?? "—"}</td>
								<td className="p-4 text-b3 text-foreground">{reconciliationCustomerLabel(record)}</td>
								<td className="p-4 text-b3 text-foreground">{RECONCILIATION_TYPE_LABEL[record.transactionType]}</td>
								<td className="p-4 text-b3 whitespace-nowrap text-foreground">{amountLabel(record)}</td>
								<td className="p-4 text-b3 whitespace-nowrap text-foreground">
									{formatTransactionDate(record.transactionDate)}
								</td>
								<td className="p-4">
									<StatusPill record={record} />
								</td>
								<td className="p-4">
									<ViewLink record={record} />
								</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>

			<div className="flex flex-col gap-3 lg:hidden">
				{records.map((record) => (
					<div key={record.reference} className="flex flex-col gap-3 rounded-xl border border-border p-4">
						<CardRow label="Request ID" value={record.paymentReference ?? "—"} />
						<CardRow label="Customer" value={reconciliationCustomerLabel(record)} />
						<CardRow label="Type" value={RECONCILIATION_TYPE_LABEL[record.transactionType]} />
						<CardRow label="Amount" value={amountLabel(record)} />
						<CardRow label="Status" value={<StatusPill record={record} />} />
						<div className="flex justify-end">
							<ViewLink record={record} />
						</div>
					</div>
				))}
			</div>
		</>
	);
}

export { ReconciliationTable };
