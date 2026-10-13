"use client";

import Link from "next/link";
import { Eye, GitCompareArrows } from "lucide-react";
import { Badge } from "@repo/ui/badge";
import { EmptyState } from "@repo/ui/empty-state";
import { cn } from "@repo/ui/lib/utils";
import {
	displayReconciliationStatus,
	reconciliationExpectedAmount,
	reconciliationMethodLabel,
	reconciliationRequestId,
	RECONCILIATION_STATUS_BADGE,
} from "@/lib/reconciliation";
import { formatUsdc } from "@/lib/currency";
import type { ReconciliationData } from "@/lib/api/types";

const DOT_CLASS: Record<string, string> = {
	completed: "bg-success-600",
	failed: "bg-danger-600",
	pending: "bg-warning-600",
};

function StatusPill({ record }: { record: ReconciliationData }) {
	const badge = RECONCILIATION_STATUS_BADGE[displayReconciliationStatus(record)];
	return (
		<Badge variant={badge.variant}>
			<span className={cn("size-1.5 rounded-full", DOT_CLASS[badge.variant])} aria-hidden="true" />
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

/** No "Customer" field exists anywhere in the reconciliation data model —
 * neither `ReconciliationPaymentLinkData` nor `ReconciliationFundingIntentData`
 * carries an identity, and most real payers are external Stellar wallets
 * with no name at all (confirmed against `TransactionDto`'s own
 * `counterparty`/`externalAddress` fields). Shows a truncated payer address
 * when one exists, never a fabricated name. */
function payerLabel(record: ReconciliationData) {
	if (!record.externalAddress) return "—";
	const address = record.externalAddress;
	return address.length > 12 ? `${address.slice(0, 5)}...${address.slice(-5)}` : address;
}

/**
 * The Reconciliation table — same dual desktop-table/mobile-card shape as
 * `PaymentsTable`. "Customer" column is real-data-backed (payer wallet
 * address, or "—" when not identifiable) rather than the mock's own
 * placeholder names — see `payerLabel`'s own note.
 */
function ReconciliationTable({ records }: { records: ReconciliationData[] }) {
	if (records.length === 0) {
		return (
			<EmptyState
				icon={GitCompareArrows}
				title="Nothing to reconcile yet"
				description="Deposits matched against your payment links and QR code will show up here."
			/>
		);
	}

	return (
		<>
			<div className="hidden overflow-x-auto rounded-xl border border-border lg:block">
				<table className="w-full border-collapse text-left">
					<thead>
						<tr className="bg-muted">
							<th className="p-4 text-label text-muted-foreground">Request ID</th>
							<th className="p-4 text-label text-muted-foreground">Customer</th>
							<th className="p-4 text-label text-muted-foreground">Payment Method</th>
							<th className="p-4 text-label text-muted-foreground">Expected Amount</th>
							<th className="p-4 text-label text-muted-foreground">Received Amount</th>
							<th className="p-4 text-label text-muted-foreground">Reconciliation Status</th>
							<th className="p-4 text-label text-muted-foreground">Action</th>
						</tr>
					</thead>
					<tbody>
						{records.map((record) => {
							const expected = reconciliationExpectedAmount(record);
							return (
								<tr key={record.transactionId} className="border-t border-border hover:bg-muted/50">
									<td className="p-4 text-b3 text-foreground">
										{reconciliationRequestId(record) ?? "—"}
									</td>
									<td className="p-4 text-b3 text-foreground">{payerLabel(record)}</td>
									<td className="p-4 text-b3 text-foreground">{reconciliationMethodLabel(record)}</td>
									<td className="p-4 text-b3 text-foreground">
										{expected ? `${formatUsdc(Number(expected))} USDC` : "—"}
									</td>
									<td className="p-4 text-b3 text-foreground">
										{formatUsdc(Number(record.amount))} {record.currency}
									</td>
									<td className="p-4">
										<StatusPill record={record} />
									</td>
									<td className="p-4">
										<Link
											href={`/reconciliation/${record.transactionId}`}
											aria-label="View reconciliation details"
											className="flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
										>
											<Eye className="size-4" aria-hidden="true" />
										</Link>
									</td>
								</tr>
							);
						})}
					</tbody>
				</table>
			</div>

			<div className="flex flex-col gap-3 lg:hidden">
				{records.map((record) => {
					const expected = reconciliationExpectedAmount(record);
					return (
						<div
							key={record.transactionId}
							className="flex flex-col gap-3 rounded-xl border border-border p-4"
						>
							<CardRow label="Request ID" value={reconciliationRequestId(record) ?? "—"} />
							<CardRow label="Customer" value={payerLabel(record)} />
							<CardRow label="Method" value={reconciliationMethodLabel(record)} />
							<CardRow
								label="Expected"
								value={expected ? `${formatUsdc(Number(expected))} USDC` : "—"}
							/>
							<CardRow
								label="Received"
								value={`${formatUsdc(Number(record.amount))} ${record.currency}`}
							/>
							<CardRow label="Status" value={<StatusPill record={record} />} />
							<div className="flex justify-end">
								<Link
									href={`/reconciliation/${record.transactionId}`}
									aria-label="View reconciliation details"
									className="flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
								>
									<Eye className="size-4" aria-hidden="true" />
								</Link>
							</div>
						</div>
					);
				})}
			</div>
		</>
	);
}

export { ReconciliationTable };
