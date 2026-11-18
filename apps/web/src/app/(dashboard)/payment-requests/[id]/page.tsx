"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { SearchX } from "lucide-react";
import { Button } from "@repo/ui/button";
import { Skeleton } from "@repo/ui/skeleton";
import { EmptyState } from "@repo/ui/empty-state";
import { toast } from "@repo/ui/sonner";
import { MobileStepHeader } from "@/features/wallet/components/MobileStepHeader";
import { PageHeader } from "@/components/layouts/PageHeader";
import { PaymentLinkCreatedCard } from "@/features/merchant/components/PaymentLinkCreatedCard";
import { PaymentRequestDetailCard } from "@/features/payment-requests/components/PaymentRequestDetailCard";
import { PaymentLinkPaymentsCard } from "@/features/merchant/components/PaymentLinkPaymentsCard";
import {
	useCancelPaymentRequest,
	usePaymentRequest,
	usePaymentRequestPayments,
} from "@/features/payment-requests/hooks";
import { CANCELLABLE_STATUSES } from "@/components/PaymentLinkStatusPill";
import { getApiErrorMessage } from "@/lib/api/errorMessage";

/** c3 mock. "Cancel request" while pending/flagged/expired (the API's own
 * rule; it can't reverse an on-chain payment). "View associated payment
 * transaction" once a credited payment is attributed to the request. */
export default function PaymentRequestDetailPage() {
	const params = useParams<{ id: string }>();
	const router = useRouter();
	const { data: request, isLoading, isError, error } = usePaymentRequest(params.id);
	const cancelRequest = useCancelPaymentRequest();
	const { data: payments } = usePaymentRequestPayments(params.id);
	const transactionId = payments?.find((p) => p.transactionId)?.transactionId ?? null;

	function handleCancel() {
		if (!request) return;
		cancelRequest.mutate(request.id, {
			onSuccess: () => toast.success(`Payment request ${request.reference} cancelled`),
			onError: (err) => toast.error(getApiErrorMessage(err, "Couldn't cancel this request.")),
		});
	}

	const cancelButton =
		request && CANCELLABLE_STATUSES.includes(request.status) ? (
			<Button
				type="button"
				variant="outline"
				size="large"
				loading={cancelRequest.isPending}
				onClick={handleCancel}
			>
				Cancel request
			</Button>
		) : undefined;

	return (
		<div className="flex flex-col gap-6 sm:gap-8">
			<MobileStepHeader title="Payment Requests" onBack={() => router.push("/payment-requests")} />
			<PageHeader
				title="Payment Request Details"
				subtitle="View details of this payment request."
				action={cancelButton}
			/>

			{isLoading ? (
				<div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-6">
					<Skeleton className="h-96 w-full rounded-2xl" />
					<Skeleton className="h-72 w-full rounded-2xl" />
				</div>
			) : isError || !request ? (
				<EmptyState
					icon={SearchX}
					title="Payment request not found"
					description={getApiErrorMessage(error, "It may have been removed, or the link is out of date.")}
				/>
			) : (
				<>
					<div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-6">
						<PaymentRequestDetailCard request={request} />
						<div className="flex flex-col gap-4 lg:self-start">
							<PaymentLinkCreatedCard link={request.url} title="Payment Link" inlineQr />
							<PaymentLinkPaymentsCard linkId={request.id} />
						</div>
					</div>

					<div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
						{transactionId && (
							<Button asChild variant="outline" size="large" className="rounded-full">
								<Link href={`/transactions/${transactionId}`}>
									View associated payment transaction
								</Link>
							</Button>
						)}
						{cancelButton && <div className="lg:hidden [&>button]:w-full">{cancelButton}</div>}
					</div>
				</>
			)}
		</div>
	);
}
