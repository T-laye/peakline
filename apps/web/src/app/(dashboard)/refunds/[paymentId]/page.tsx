"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ChevronRight, SearchX } from "lucide-react";
import { Alert } from "@repo/ui/alert";
import { Button } from "@repo/ui/button";
import { EmptyState } from "@repo/ui/empty-state";
import { Skeleton } from "@repo/ui/skeleton";
import { MobileStepHeader } from "@/features/wallet/components/MobileStepHeader";
import { PageHeader } from "@/components/layouts/PageHeader";
import { useRefundablePayment } from "@/features/refunds/hooks";
import { PaymentSections } from "@/features/refunds/components/PaymentSections";
import { InitiateRefundDialog } from "@/features/refunds/components/InitiateRefundDialog";
import {
	AmountBox,
	FromCustomer,
	RefundStatusPill,
	formatShortDate,
	maskWallet,
} from "@/features/refunds/components/parts";
import { formatUsdc } from "@/lib/currency";
import { getApiErrorMessage } from "@/lib/api/errorMessage";

/** c4 "Initiate Refund" page for one payment (`[paymentId]` = its ledger
 * transaction id): the payment, its refunds, and the refund dialog (c5). */
export default function InitiateRefundPage() {
	const params = useParams<{ paymentId: string }>();
	const router = useRouter();
	const { record, request, refunds, refundable, isLoading, isError, error } = useRefundablePayment(
		params.paymentId,
	);
	const [open, setOpen] = useState(false);
	// New dialog instance per attempt: fresh form and idempotency key.
	const [attempt, setAttempt] = useState(0);

	const remaining = refundable ? Number(refundable.remaining) : 0;
	const pending = refundable ? Number(refundable.pending) : 0;
	const isRefundablePayment = record?.transactionType === "payment" && record.paymentStatus === "completed";
	const customerName = record?.customerName ?? request?.customerName ?? record?.customerEmail ?? "Customer";

	return (
		<div className="flex flex-col gap-6 sm:gap-8">
			<MobileStepHeader title="Initiate Refund" onBack={() => router.push("/refunds")} />
			<PageHeader title="Initiate Refund" subtitle="Review the original payment before refunding it." />

			{isLoading ? (
				<Skeleton className="h-96 w-full rounded-2xl" />
			) : isError || !record || !refundable ? (
				<EmptyState
					icon={SearchX}
					title="Payment not found"
					description={getApiErrorMessage(error, "It may not belong to one of your businesses.")}
				/>
			) : (
				<>
					<AmountBox amount={Number(record.amount)} prefix="+" />
					<FromCustomer
						name={customerName}
						detail={request?.customerPhone ?? (record.counterpartyAddress ? maskWallet(record.counterpartyAddress) : null)}
					/>
					<PaymentSections payment={record} request={request} />

					{pending > 0 && (
						<Alert variant="info">
							{formatUsdc(pending)} USDC is in a refund that&apos;s still in progress. It&apos;s held back from the
							refundable balance until it settles.
						</Alert>
					)}

					{refunds && refunds.length > 0 && (
						<section className="flex flex-col gap-3">
							<h2 className="text-b2 font-medium text-foreground sm:text-b1">Refunds on this payment</h2>
							<div className="flex flex-col divide-y divide-border rounded-xl border border-border">
								{refunds.map((refund) => (
									<Link
										key={refund.id}
										href={`/refunds/${params.paymentId}/${refund.id}`}
										className="flex items-center justify-between gap-3 p-4 transition-colors hover:bg-muted/50"
									>
										<div className="flex min-w-0 flex-col">
											<span className="text-b3 font-medium text-foreground">
												{formatUsdc(Number(refund.amount))} USDC
											</span>
											<span className="truncate text-c1 text-muted-foreground">
												{formatShortDate(refund.createdAt)} · {refund.reason}
											</span>
										</div>
										<div className="flex shrink-0 items-center gap-2">
											<RefundStatusPill refund={refund} />
											<ChevronRight className="size-4 text-muted-foreground" aria-hidden="true" />
										</div>
									</Link>
								))}
							</div>
						</section>
					)}

					<div className="flex flex-col items-center gap-2">
						<Button
							type="button"
							variant="outline"
							size="large"
							className="w-full rounded-full sm:w-auto"
							disabled={!isRefundablePayment || remaining <= 0 || !record.counterpartyAddress}
							onClick={() => {
								setAttempt((n) => n + 1);
								setOpen(true);
							}}
						>
							Initiate Refund
						</Button>
						<span className="text-c1 text-muted-foreground">
							{!isRefundablePayment
								? "Only completed payments can be refunded"
								: !record.counterpartyAddress
									? "This payment has no sender address to refund to"
									: remaining > 0
										? `${formatUsdc(remaining)} USDC refundable`
										: "Nothing left to refund on this payment"}
						</span>
					</div>

					{record.counterpartyAddress && (
						<InitiateRefundDialog
							key={attempt}
							paymentId={params.paymentId}
							payerAddress={record.counterpartyAddress}
							refundable={refundable}
							open={open}
							onOpenChange={setOpen}
						/>
					)}
				</>
			)}
		</div>
	);
}
