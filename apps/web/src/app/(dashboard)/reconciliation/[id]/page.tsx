"use client";

import { useParams, useRouter } from "next/navigation";
import { MobileStepHeader } from "@/features/wallet/components/MobileStepHeader";
import { ReconciliationDetail } from "@/features/merchant/components/ReconciliationDetail";

/** `[id]` is the underlying transaction's own id — a reconciliation record
 * has no separate id of its own (see `ReconciliationData`'s own note). Same
 * desktop "Back to Reconciliation" handled centrally by `Topbar`'s
 * `parentBreadcrumb` (prefix-matches any route nested under a top-level nav
 * item) as every other detail page in this app — only the mobile header
 * needs its own `onBack` here. */
export default function ReconciliationDetailPage() {
	const params = useParams<{ id: string }>();
	const router = useRouter();

	return (
		<div className="flex flex-col gap-6 sm:gap-8">
			<MobileStepHeader title="Reconciliation" onBack={() => router.push("/reconciliation")} />
			<ReconciliationDetail txId={params.id} />
		</div>
	);
}
