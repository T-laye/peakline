"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Check, Clock, RefreshCw, SearchX, X } from "lucide-react";
import { Alert } from "@repo/ui/alert";
import { Button } from "@repo/ui/button";
import { EmptyState } from "@repo/ui/empty-state";
import { Skeleton } from "@repo/ui/skeleton";
import { cn } from "@repo/ui/lib/utils";
import { toast } from "@repo/ui/sonner";
import { MobileStepHeader } from "@/features/wallet/components/MobileStepHeader";
import { useCancelRefund, useRefund, useRefundablePayment } from "@/features/refunds/hooks";
import { PaymentSections } from "@/features/refunds/components/PaymentSections";
import { InitiateRefundDialog } from "@/features/refunds/components/InitiateRefundDialog";
import {
	AmountBox,
	CopyRow,
	ExplorerRow,
	FromCustomer,
	InfoRow,
	InfoSection,
	refundStatusLabel,
	isCancelledRefund,
	formatDateTime,
	maskWallet,
} from "@/features/refunds/components/parts";
import { formatUsdc } from "@/lib/currency";
import { getApiErrorMessage } from "@/lib/api/errorMessage";
import type { RefundStatus } from "@/lib/api/types";

const BANNER: Record<RefundStatus, { icon: typeof Check; className: string; text: string }> = {
	requested: { icon: Clock, className: "bg-warning text-warning-foreground", text: "text-warning-700" },
	authorized: { icon: Clock, className: "bg-warning text-warning-foreground", text: "text-warning-700" },
	processing: { icon: RefreshCw, className: "bg-info text-info-foreground", text: "text-info-700" },
	completed: { icon: Check, className: "bg-primary-700 text-primary-foreground", text: "text-success-700" },
	failed: { icon: X, className: "bg-destructive text-destructive-foreground", text: "text-danger-600" },
};

/** c6 "Refund Details": status banner, the original payment, the refund.
 * A refund still `requested` or `authorized` can be authorized/retried or
 * cancelled from here (the detail query polls while `processing`). */
export default function RefundDetailsPage() {
	const params = useParams<{ paymentId: string; refundId: string }>();
	const router = useRouter();
	const { data: refund, isLoading, isError, error } = useRefund(params.refundId);
	const payment = useRefundablePayment(params.paymentId);
	const cancelRefund = useCancelRefund();
	const [resumeOpen, setResumeOpen] = useState(false);

	const canResume = refund?.status === "requested" || refund?.status === "authorized";

	return (
		<div className="flex flex-col gap-6 sm:gap-8">
			<MobileStepHeader title="Refund Details" onBack={() => router.push(`/refunds/${params.paymentId}`)} />
			{isLoading || payment.isLoading ? (
				<Skeleton className="h-96 w-full rounded-2xl" />
			) : isError || !refund ? (
				<EmptyState
					icon={SearchX}
					title="Refund not found"
					description={getApiErrorMessage(error, "It may not belong to one of your businesses.")}
				/>
			) : (
				(() => {
					const banner = isCancelledRefund(refund)
						? { icon: X, className: "bg-neutral-200 text-neutral-800", text: "text-muted-foreground" }
						: BANNER[refund.status];
					const Icon = banner.icon;
					const record = payment.record;
					return (
						<>
							<div className={cn("flex items-center gap-4 rounded-2xl p-5 sm:p-8", banner.className)}>
								<span className="flex size-10 items-center justify-center rounded-full border-2 border-current sm:size-14">
									<Icon className={cn("size-5 sm:size-7", refund.status === "processing" && "animate-spin")} aria-hidden="true" />
								</span>
								<span className="text-s1 sm:text-h4">{refundStatusLabel(refund)}</span>
							</div>

							<div className="flex flex-col gap-1">
								<h1 className="hidden text-h4 text-foreground lg:block">Refund Details</h1>
								{payment.request && <p className="text-s1 text-foreground sm:text-h5">{payment.request.title}</p>}
							</div>

							{refund.status === "failed" && refund.failureReason && !isCancelledRefund(refund) && (
								<Alert variant="error">{refund.failureReason}</Alert>
							)}

							{canResume && (
								<Alert variant="warning">
									{refund.status === "requested"
										? "This refund hasn't been authorized yet. Its amount is reserved until you authorize or cancel it."
										: "This refund was authorized but couldn't start (usually a low business balance). Top up, then retry."}
									<div className="mt-3 flex flex-wrap gap-2">
										<Button type="button" size="small" onClick={() => setResumeOpen(true)}>
											{refund.status === "requested" ? "Authorize refund" : "Retry refund"}
										</Button>
										<Button
											type="button"
											size="small"
											variant="outline"
											loading={cancelRefund.isPending}
											onClick={() =>
												cancelRefund.mutate(refund.id, {
													onSuccess: () => toast.success("Refund cancelled"),
													onError: (err) => toast.error(getApiErrorMessage(err, "Couldn't cancel this refund")),
												})
											}
										>
											Cancel refund
										</Button>
									</div>
								</Alert>
							)}

							{record && (
								<>
									<AmountBox amount={Number(record.amount)} prefix="+" />
									<FromCustomer
										name={record.customerName ?? payment.request?.customerName ?? record.customerEmail ?? "Customer"}
										detail={payment.request?.customerPhone ?? (record.counterpartyAddress ? maskWallet(record.counterpartyAddress) : null)}
									/>
									<PaymentSections payment={record} request={payment.request} />
								</>
							)}

							<div className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:gap-12">
								<InfoSection title="Refund information">
									<InfoRow label="Customer's original payment wallet" value={maskWallet(refund.recipientAddress)} />
									<InfoRow label="Refund Amount" value={`${formatUsdc(Number(refund.amount))} ${refund.currency}`} />
									<InfoRow label="Reason" value={refund.reason} />
									<InfoRow label="Network" value="Stellar Testnet" />
									{record?.stellarTxHash && (
										<InfoRow label="Payment Reference" value={record.paymentReference ?? record.reference} valueClassName="font-normal" />
									)}
									<CopyRow label="Refund Reference" value={refund.id} />
									<InfoRow label="Requested" value={formatDateTime(refund.createdAt)} />
									{refund.completedAt && <InfoRow label="Completed" value={formatDateTime(refund.completedAt)} />}
									<InfoRow label="Refund Status" value={refundStatusLabel(refund)} valueClassName={banner.text} />
									{refund.stellarTxHash && <CopyRow label="Transaction Hash" value={refund.stellarTxHash} />}
									{refund.stellarTxHash && <ExplorerRow hash={refund.stellarTxHash} />}
								</InfoSection>
								{refund.refundable && (
									<InfoSection title="Refundable balance">
										<InfoRow label="Original payment" value={`${formatUsdc(Number(refund.refundable.paymentAmount))} USDC`} />
										<InfoRow label="Refunded" value={`${formatUsdc(Number(refund.refundable.refunded))} USDC`} />
										<InfoRow label="In progress" value={`${formatUsdc(Number(refund.refundable.pending))} USDC`} />
										<InfoRow label="Remaining" value={`${formatUsdc(Number(refund.refundable.remaining))} USDC`} />
									</InfoSection>
								)}
							</div>

							{canResume && (
								<InitiateRefundDialog
									paymentId={params.paymentId}
									payerAddress={refund.recipientAddress}
									refundable={
										refund.refundable ?? { paymentAmount: refund.amount, refunded: "0", pending: refund.amount, remaining: "0" }
									}
									existingRefund={refund}
									open={resumeOpen}
									onOpenChange={setResumeOpen}
								/>
							)}
						</>
					);
				})()
			)}
		</div>
	);
}
