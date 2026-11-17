"use client";

import { useParams, useRouter } from "next/navigation";
import { Check, Clock, RefreshCw, SearchX, X } from "lucide-react";
import { Alert } from "@repo/ui/alert";
import { EmptyState } from "@repo/ui/empty-state";
import { Skeleton } from "@repo/ui/skeleton";
import { cn } from "@repo/ui/lib/utils";
import { MobileStepHeader } from "@/features/wallet/components/MobileStepHeader";
import { useRefund } from "@/features/refunds/hooks";
import { PaymentSections } from "@/features/refunds/components/PaymentSections";
import {
	AmountBox,
	CopyRow,
	ExplorerRow,
	FromCustomer,
	InfoRow,
	InfoSection,
	REFUND_STATUS_LABEL,
	maskWallet,
	formatDateTime,
} from "@/features/refunds/components/parts";
import { formatUsdc } from "@/lib/currency";
import { getApiErrorMessage } from "@/lib/api/errorMessage";
import type { RefundablePaymentData, RefundData, RefundStatus } from "@/lib/api/types";

const BANNER: Record<RefundStatus, { icon: typeof Check; className: string; text: string }> = {
	requested: { icon: Clock, className: "bg-warning text-warning-foreground", text: "text-warning-700" },
	authorized: { icon: Clock, className: "bg-warning text-warning-foreground", text: "text-warning-700" },
	processing: { icon: RefreshCw, className: "bg-info text-info-foreground", text: "text-info-700" },
	completed: { icon: Check, className: "bg-primary-700 text-primary-foreground", text: "text-success-700" },
	failed: { icon: X, className: "bg-destructive text-destructive-foreground", text: "text-danger-600" },
};

function RefundDetails({ refund, payment }: { refund: RefundData; payment: RefundablePaymentData }) {
	const banner = BANNER[refund.status];
	const Icon = banner.icon;

	return (
		<>
			<div className={cn("flex items-center gap-4 rounded-2xl p-5 sm:p-8", banner.className)}>
				<span className="flex size-10 items-center justify-center rounded-full border-2 border-current sm:size-14">
					<Icon className="size-5 sm:size-7" aria-hidden="true" />
				</span>
				<span className="text-s1 sm:text-h4">{REFUND_STATUS_LABEL[refund.status]}</span>
			</div>

			<div className="flex flex-col gap-1">
				<h1 className="hidden text-h4 text-foreground lg:block">Refund Details</h1>
				<p className="text-s1 text-foreground sm:text-h5">{payment.title}</p>
			</div>

			{refund.status === "failed" && refund.failureReason && (
				<Alert variant="error">{refund.failureReason}</Alert>
			)}

			<AmountBox amount={Number(payment.amount)} prefix="+" />
			<FromCustomer name={payment.customer.name} phone={payment.customer.phone} />
			<PaymentSections payment={payment} />

			<div className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:gap-12">
				<InfoSection title="Refund information">
					<InfoRow label="Customer's original payment wallet" value={maskWallet(refund.destinationWallet)} />
					<InfoRow label="Refund Type" value={refund.type === "full" ? "Full" : "Partial"} />
					<InfoRow label="Refund Amount" value={`${formatUsdc(Number(refund.amount))} USDC`} />
					<InfoRow label="Reason" value={refund.reason} />
					<InfoRow label="Network" value="Stellar Testnet" />
					<InfoRow label="Est. Fee" value="0.00 USDC" valueClassName="font-normal text-muted-foreground" />
					<InfoRow label="Payment Reference" value={payment.reference} valueClassName="font-normal" />
					<InfoRow label="Refund Reference" value={refund.id.toUpperCase()} valueClassName="font-normal" />
					<InfoRow label="Requested" value={formatDateTime(refund.createdAt)} />
					<InfoRow label="Refund Status" value={REFUND_STATUS_LABEL[refund.status]} valueClassName={banner.text} />
					{refund.stellarTxHash && <CopyRow label="Transaction ID" value={refund.stellarTxHash} />}
					{refund.stellarTxHash && <ExplorerRow hash={refund.stellarTxHash} />}
				</InfoSection>
			</div>
		</>
	);
}

/** c6 "Refund Details": status banner, the original payment, then the
 * refund itself. */
export default function RefundDetailsPage() {
	const params = useParams<{ paymentId: string; refundId: string }>();
	const router = useRouter();
	const { data, isLoading, isError, error } = useRefund(params.refundId);

	return (
		<div className="flex flex-col gap-6 sm:gap-8">
			<MobileStepHeader title="Refund Details" onBack={() => router.push(`/refunds/${params.paymentId}`)} />
			{isLoading ? (
				<Skeleton className="h-96 w-full rounded-2xl" />
			) : isError || !data ? (
				<EmptyState
					icon={SearchX}
					title="Refund not found"
					description={getApiErrorMessage(error, "It may have been removed.")}
				/>
			) : (
				<RefundDetails refund={data.refund} payment={data.payment} />
			)}
		</div>
	);
}
