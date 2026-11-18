"use client";

import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { Badge } from "@repo/ui/badge";
import { Skeleton } from "@repo/ui/skeleton";
import { usePaymentRequestPayments } from "@/features/payment-requests/hooks";
import { shortAddress } from "@/lib/reconciliation";
import { stellarExplorerUrl } from "@/lib/stellar";
import { formatUsdc } from "@/lib/currency";
import { formatTransactionDate } from "@/lib/transactions";

/** On-chain payments attributed to a link or request
 * (`GET /payment-links/:id/payments`). `processing` = the payer reported it
 * and it verified, awaiting credit; `matched` = credited. */
function PaymentLinkPaymentsCard({ linkId }: { linkId: string }) {
	const { data: payments, isLoading } = usePaymentRequestPayments(linkId);

	return (
		<div className="flex flex-col gap-4 rounded-2xl border border-border bg-background p-5 sm:p-6">
			<h2 className="text-b2 font-semibold text-foreground sm:text-b1">Payments received</h2>
			{isLoading || !payments ? (
				<Skeleton className="h-24 w-full" />
			) : payments.length === 0 ? (
				<p className="text-b3 text-muted-foreground">No payments yet.</p>
			) : (
				<div className="flex flex-col divide-y divide-border">
					{payments.map((p) => (
						<div key={p.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
							<div className="flex min-w-0 flex-col">
								<span className="text-b3 font-semibold text-foreground">{formatUsdc(Number(p.amount))} USDC</span>
								<span className="text-c1 text-muted-foreground">
									{formatTransactionDate(p.paidAtChain ?? p.createdAt)}
									{p.fromAddress ? ` · from ${shortAddress(p.fromAddress)}` : ""}
								</span>
							</div>
							<div className="flex items-center gap-3">
								<Badge variant={p.status === "matched" ? "completed" : "processing"}>
									{p.status === "matched" ? "Credited" : "Verifying"}
								</Badge>
								<a
									href={stellarExplorerUrl(p.stellarTxHash)}
									target="_blank"
									rel="noopener noreferrer"
									className="inline-flex items-center gap-1 text-c1 font-medium text-info-600 hover:underline"
								>
									Explorer <ExternalLink className="size-3" aria-hidden="true" />
								</a>
								{p.transactionId && (
									<Link href={`/transactions/${p.transactionId}`} className="text-c1 font-medium text-primary-600 hover:underline">
										Details
									</Link>
								)}
							</div>
						</div>
					))}
				</div>
			)}
		</div>
	);
}

export { PaymentLinkPaymentsCard };
