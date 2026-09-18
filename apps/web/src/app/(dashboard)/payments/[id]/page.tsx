"use client";

import { useParams, useRouter } from "next/navigation";
import { SearchX } from "lucide-react";
import { Skeleton } from "@repo/ui/skeleton";
import { EmptyState } from "@repo/ui/empty-state";
import { MobileStepHeader } from "@/features/wallet/components/MobileStepHeader";
import { TransactionDetail } from "@/features/transactions/components/TransactionDetail";
import { useTransaction } from "@/features/transactions/hooks";
import { getApiErrorMessage } from "@/lib/api/errorMessage";

/**
 * A payment's own receipt page — reuses `TransactionDetail` wholesale (it
 * derives "Payment"/"From" itself from the real transaction's own
 * `direction` now, rather than being told to). Its own real
 * `GET /transactions/{id}` fetch, same reasoning as `/transactions/[id]`'s
 * own — `/payments` is server-paginated, so a row opened here isn't
 * guaranteed to still be on whatever page that list last fetched.
 *
 * The mock's desktop top bar swaps the "Merchant" badge for a
 * "← Back to Payments" link — `Topbar` itself now does this centrally for
 * any route nested under a top-level nav item (see its own
 * `parentBreadcrumb`), so this page no longer needs its own desktop copy of
 * that link; only the mobile header (a different component, `Topbar` is
 * `lg`-only) still needs its own `onBack`.
 */
export default function PaymentDetailPage() {
	const params = useParams<{ id: string }>();
	const router = useRouter();
	const { data: payment, isLoading, isError, error } = useTransaction(params.id);

	return (
		<div className="flex flex-col gap-6 sm:gap-8">
			<MobileStepHeader
				title="Payments"
				onBack={() => router.push("/payments")}
			/>

			{isLoading ? (
				<div className="flex flex-col gap-6">
					<Skeleton className="h-24 w-full rounded-2xl" />
					<Skeleton className="h-20 w-full rounded-xl" />
					<Skeleton className="h-32 w-full rounded-xl" />
				</div>
			) : isError || !payment ? (
				<EmptyState
					icon={SearchX}
					title="Payment not found"
					description={getApiErrorMessage(error, "It may have been removed, or the link is out of date.")}
				/>
			) : (
				<TransactionDetail transaction={payment} />
			)}
		</div>
	);
}
