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
} from "@/features/refunds/components/parts";
import { formatUsdc } from "@/lib/currency";
import { getApiErrorMessage } from "@/lib/api/errorMessage";

/** c4 "Initiate Refund" page: the payment being refunded, its existing
 * refunds, and the button that opens the refund dialog (c5). */
export default function InitiateRefundPage() {
	const params = useParams<{ paymentId: string }>();
	const router = useRouter();
	const { data: payment, isLoading, isError, error } = useRefundablePayment(params.paymentId);
	const [open, setOpen] = useState(false);
	// New dialog instance per attempt: fresh form, balance and idempotency key.
	const [attempt, setAttempt] = useState(0);

	const remaining = payment ? Number(payment.remainingRefundable) : 0;
	const pending = payment ? Number(payment.pendingRefundAmount) : 0;

	return (
		<div className="flex flex-col gap-6 sm:gap-8">
			<MobileStepHeader title="Initiate Refund" onBack={() => router.push("/refunds")} />
			<PageHeader title="Initiate Refund" subtitle="Review the original payment before refunding it." />

			{isLoading ? (
				<Skeleton className="h-96 w-full rounded-2xl" />
			) : isError || !payment ? (
				<EmptyState
					icon={SearchX}
					title="Payment not found"
					description={getApiErrorMessage(error, "It may not be eligible for refunds.")}
				/>
			) : (
				<>
					<AmountBox amount={Number(payment.amount)} prefix="+" />
					<FromCustomer name={payment.customer.name} phone={payment.customer.phone} />
					<PaymentSections payment={payment} />

					{pending > 0 && (
						<Alert variant="info">
							{formatUsdc(pending)} USDC is in a refund that&apos;s still processing. It&apos;s held
							back from the refundable balance until it settles.
						</Alert>
					)}

					{payment.refunds.length > 0 && (
						<section className="flex flex-col gap-3">
							<h2 className="text-b2 font-medium text-foreground sm:text-b1">Refunds on this payment</h2>
							<div className="flex flex-col divide-y divide-border rounded-xl border border-border">
								{payment.refunds.map((refund) => (
									<Link
										key={refund.id}
										href={`/refunds/${payment.id}/${refund.id}`}
										className="flex items-center justify-between gap-3 p-4 transition-colors hover:bg-muted/50"
									>
										<div className="flex min-w-0 flex-col">
											<span className="text-b3 font-medium text-foreground">
												{formatUsdc(Number(refund.amount))} USDC · {refund.type === "full" ? "Full" : "Partial"}
											</span>
											<span className="truncate text-c1 text-muted-foreground">
												{formatShortDate(refund.createdAt)} · {refund.reason}
											</span>
										</div>
										<div className="flex shrink-0 items-center gap-2">
											<RefundStatusPill status={refund.status} />
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
							disabled={remaining <= 0}
							onClick={() => {
								setAttempt((n) => n + 1);
								setOpen(true);
							}}
						>
							Initiate Refund
						</Button>
						<span className="text-c1 text-muted-foreground">
							{remaining > 0
								? `${formatUsdc(remaining)} USDC refundable`
								: "Nothing left to refund on this payment"}
						</span>
					</div>

					<InitiateRefundDialog key={attempt} payment={payment} open={open} onOpenChange={setOpen} />
				</>
			)}
		</div>
	);
}
