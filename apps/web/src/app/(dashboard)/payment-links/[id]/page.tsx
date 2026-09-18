"use client";

import { useParams, useRouter } from "next/navigation";
import { SearchX } from "lucide-react";
import { Skeleton } from "@repo/ui/skeleton";
import { EmptyState } from "@repo/ui/empty-state";
import { MobileStepHeader } from "@/features/wallet/components/MobileStepHeader";
import { PageHeader } from "@/components/layouts/PageHeader";
import { PaymentLinkDetailCard } from "@/features/merchant/components/PaymentLinkDetailCard";
import { PaymentLinkCreatedCard } from "@/features/merchant/components/PaymentLinkCreatedCard";
import { useMerchantPaymentLink } from "@/features/merchant/hooks";
import { getApiErrorMessage } from "@/lib/api/errorMessage";

/**
 * A payment link's own detail page — reuses `PaymentLinkCreatedCard` for its
 * right-hand share panel (identical to the create page's post-creation
 * state, just titled "Payment Link" instead of "Payment Link Created"), and
 * a dedicated `PaymentLinkDetailCard` for the left receipt-style card (a
 * payment link isn't a `Transaction`, so `TransactionDetail` doesn't fit).
 * Its own `GET /payment-links/{id}` fetch, not a lookup into the list's own
 * cache — the list is server-paginated now, so a link viewed here isn't
 * guaranteed to be on whatever page the list last fetched. Desktop's "← Back
 * to Payment Links" comes from `Topbar`'s own breadcrumb (any route nested
 * under `/payment-links`), same as `/payments/[id]`.
 */
export default function PaymentLinkDetailPage() {
	const params = useParams<{ id: string }>();
	const router = useRouter();
	const { data: link, isLoading, isError, error } = useMerchantPaymentLink(params.id);

	return (
		<div className="flex flex-col gap-6 sm:gap-8">
			<MobileStepHeader
				title="Payment Links"
				onBack={() => router.push("/payment-links")}
			/>
			<PageHeader title="Payment Link" subtitle="View details of this payment link." />

			{isLoading ? (
				<div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-6">
					<Skeleton className="h-72 w-full rounded-2xl" />
					<Skeleton className="h-72 w-full rounded-2xl" />
				</div>
			) : isError || !link ? (
				<EmptyState
					icon={SearchX}
					title="Payment link not found"
					description={getApiErrorMessage(error, "It may have been cancelled, or the link is out of date.")}
				/>
			) : (
				<div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-6">
					<PaymentLinkDetailCard link={link} />
					<PaymentLinkCreatedCard link={link.url} title="Payment Link" />
				</div>
			)}
		</div>
	);
}
