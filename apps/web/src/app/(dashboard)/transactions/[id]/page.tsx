"use client";

import { useParams, useRouter } from "next/navigation";
import { ChevronLeft, SearchX } from "lucide-react";
import { Skeleton } from "@repo/ui/skeleton";
import { EmptyState } from "@repo/ui/empty-state";
import { MobileStepHeader } from "@/features/wallet/components/MobileStepHeader";
import { TransactionDetail } from "@/features/transactions/components/TransactionDetail";
import { useTransaction } from "@/features/transactions/hooks";
import { useAuthStore } from "@/lib/stores/authStore";
import { getApiErrorMessage } from "@/lib/api/errorMessage";

/**
 * Its own real `GET /transactions/{id}` fetch now, rather than finding the
 * id in whichever list happened to be cached — the list is server-paginated
 * (see `useTransactions`), so a transaction opened here isn't guaranteed to
 * be on whatever page the list last fetched. Same endpoint, and now the
 * same component, for both account types — `TransactionDetail` derives its
 * own noun/counterparty-label wording from the transaction's real `type`/
 * `direction` instead of the caller guessing "Payment" for merchant,
 * "Transfer" for individual.
 *
 * The desktop mock shows "← Back to Transactions" sitting inside the same
 * bar as the notification bell/avatar — `Topbar` itself now provides this
 * centrally for a merchant session (any route nested under a top-level nav
 * item, see its own `parentBreadcrumb`), so only the individual branch
 * still needs this page's own copy of that link; individual's `Topbar`
 * never shows the badge/breadcrumb row at all.
 */
export default function TransactionDetailPage() {
	const params = useParams<{ id: string }>();
	const router = useRouter();
	const isMerchant = useAuthStore((state) => state.customerType === "merchant");
	const { data: transaction, isLoading, isError, error } = useTransaction(params.id);

	return (
		<div className="flex flex-col gap-6 sm:gap-8">
			<MobileStepHeader
				title="Transactions"
				onBack={() => router.push("/transactions")}
			/>
			{!isMerchant && (
				<button
					type="button"
					onClick={() => router.push("/transactions")}
					className="hidden items-center gap-2 text-b3 font-medium text-foreground hover:text-primary-600 lg:flex"
				>
					<ChevronLeft className="size-4" aria-hidden="true" />
					Back to Transactions
				</button>
			)}

			{isLoading ? (
				<div className="flex flex-col gap-6">
					<Skeleton className="h-24 w-full rounded-2xl" />
					<Skeleton className="h-20 w-full rounded-xl" />
					<Skeleton className="h-32 w-full rounded-xl" />
				</div>
			) : isError || !transaction ? (
				<EmptyState
					icon={SearchX}
					title="Transaction not found"
					description={getApiErrorMessage(error, "It may have been removed, or the link is out of date.")}
				/>
			) : (
				<TransactionDetail transaction={transaction} />
			)}
		</div>
	);
}
