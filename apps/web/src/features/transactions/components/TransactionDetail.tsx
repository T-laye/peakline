"use client";

import { Check, Clock, RefreshCw, X, Ban, Copy } from "lucide-react";
import { toast } from "@repo/ui/sonner";
import { UserAvatar } from "@/features/dashboard/components/UserAvatar";
import {
	STATUS_LABEL,
	METHOD_LABEL,
	transactionNoun,
	transactionCounterpartyLabel,
	transactionCounterpartyFieldLabel,
	formatTransactionDate,
} from "@/lib/transactions";
import { formatUsdc, usdcToGhs } from "@/lib/currency";
import type { TransactionData, TransactionLedgerStatus } from "@/lib/api/types";

const STATUS_BANNER: Record<
	TransactionLedgerStatus,
	{ icon: typeof Check; className: string; headingSuffix: string }
> = {
	completed: { icon: Check, className: "bg-success text-success-foreground", headingSuffix: "Successful!" },
	pending: { icon: Clock, className: "bg-warning text-warning-foreground", headingSuffix: "Pending" },
	processing: { icon: RefreshCw, className: "bg-info text-info-foreground", headingSuffix: "Processing" },
	failed: { icon: X, className: "bg-destructive text-destructive-foreground", headingSuffix: "Failed" },
	reversed: { icon: Ban, className: "bg-neutral-700 text-white", headingSuffix: "Reversed" },
};

function DetailRow({ label, value }: { label: string; value: string }) {
	return (
		<div className="flex items-center justify-between gap-4 py-3 text-c1 sm:text-b3">
			<span className="text-muted-foreground">{label}</span>
			<span className="font-semibold text-foreground">{value}</span>
		</div>
	);
}

/**
 * The receipt-style page a `TransactionRow` (or a merchant `PaymentsTable`
 * row) links to. Status-aware rather than a fixed "Transfer Successful!" —
 * banner color, icon, and heading all follow the fixed status→token mapping
 * from CLAUDE.md (Pending→warning, Processing→info, Completed→success,
 * Failed→destructive; `reversed` gets the same neutral treatment
 * "Cancelled" would have, there being no dedicated token for it). The
 * heading noun ("Transfer"/"Payment"/"Deposit"/...) and counterparty label
 * ("To"/"From") are both derived from the transaction's own real `type`/
 * `direction` now (see `lib/transactions.ts`) rather than being passed in
 * by the caller — a real ledger row already knows which way it went.
 */
function TransactionDetail({ transaction }: { transaction: TransactionData }) {
	const { icon: Icon, className, headingSuffix } = STATUS_BANNER[transaction.status];
	const amount = Number(transaction.amount);
	const counterpartyName = transactionCounterpartyLabel(transaction);
	const txRef = transaction.stellarTxHash ?? transaction.id;

	async function handleCopyTxId() {
		try {
			await navigator.clipboard.writeText(txRef);
			toast.success("Transaction ID copied");
		} catch {
			toast.error("Couldn't copy");
		}
	}

	return (
		<div className="flex flex-col gap-6">
			<div className={`flex items-center gap-3 rounded-2xl p-5 sm:p-6 ${className}`}>
				<Icon className="size-6 shrink-0" aria-hidden="true" />
				<span className="text-s1 sm:text-h5">{STATUS_LABEL[transaction.status]}</span>
			</div>

			<div className="flex flex-col items-center gap-1 text-center">
				<h2 className="text-s1 text-foreground sm:text-h5">
					{transactionNoun(transaction)} {headingSuffix}
				</h2>
			</div>

			<div className="flex flex-col gap-1 rounded-xl border border-secondary-300 bg-secondary-100 p-4 sm:p-5">
				<span className="text-h5 text-foreground sm:text-h4">
					{formatUsdc(amount)} {transaction.currency}
				</span>
				<span className="text-c1 text-muted-foreground sm:text-b3">
					~ GHS {formatUsdc(usdcToGhs(amount))}
				</span>
			</div>

			{counterpartyName && (
				<div className="flex flex-col gap-2">
					<span className="text-c1 text-muted-foreground sm:text-b3">
						{transactionCounterpartyFieldLabel(transaction)}
					</span>
					<div className="flex items-center gap-3">
						<UserAvatar
							name={counterpartyName}
							className="bg-primary-600 text-primary-foreground"
						/>
						<div className="flex flex-col">
							<span className="text-b3 font-semibold text-foreground sm:text-b2">
								{counterpartyName}
							</span>
							{transaction.counterparty?.phone && (
								<span className="text-c1 text-muted-foreground sm:text-b3">
									{transaction.counterparty.phone}
								</span>
							)}
						</div>
					</div>
				</div>
			)}

			<div className="flex flex-col divide-y divide-border">
				<DetailRow
					label="Date"
					value={formatTransactionDate(transaction.completedAt ?? transaction.createdAt)}
				/>
				{transaction.method && (
					<DetailRow label="Method" value={METHOD_LABEL[transaction.method]} />
				)}
				<DetailRow label="Fee" value={`${formatUsdc(Number(transaction.fee))} ${transaction.currency}`} />
				{transaction.business && (
					<DetailRow label="Business" value={transaction.business.name} />
				)}
				<div className="flex items-center justify-between gap-4 py-3 text-c1 sm:text-b3">
					<span className="text-muted-foreground">Transaction ID</span>
					<button
						type="button"
						onClick={handleCopyTxId}
						className="flex items-center gap-1.5 font-semibold text-foreground hover:text-primary-600"
					>
						<span className="max-w-48 truncate sm:max-w-none">{txRef}</span>
						<Copy className="size-4 shrink-0" aria-hidden="true" />
					</button>
				</div>
			</div>
		</div>
	);
}

export { TransactionDetail };
