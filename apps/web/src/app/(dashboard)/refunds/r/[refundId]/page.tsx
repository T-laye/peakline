"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { SearchX } from "lucide-react";
import { EmptyState } from "@repo/ui/empty-state";
import { LoadingBar } from "@repo/ui/loading-bar";
import { useRefund } from "@/features/refunds/hooks";

/** `/refunds/r/{refundId}` — notifications only carry the refund id, so
 * look up its original payment and forward to the full details route. */
export default function RefundRedirectPage() {
	const params = useParams<{ refundId: string }>();
	const router = useRouter();
	const { data: refund, isError } = useRefund(params.refundId);

	useEffect(() => {
		if (refund) router.replace(`/refunds/${refund.originalTransactionId}/${refund.id}`);
	}, [refund, router]);

	if (isError) {
		return <EmptyState icon={SearchX} title="Refund not found" description="It may not belong to one of your businesses." />;
	}
	return <LoadingBar />;
}
