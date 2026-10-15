"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { ExternalPaymentReconciliationStep } from "@/features/pay/components/ExternalPaymentReconciliationStep";
import { usePayFlowStore } from "@/features/pay/store/payFlowStore";

export default function ExternalPaymentReconciliationPage() {
	const router = useRouter();
	const link = usePayFlowStore((state) => state.link);
	const verification = usePayFlowStore((state) => state.verification);
	const reset = usePayFlowStore((state) => state.reset);

	const ready = link && verification?.status === "needs_reconciliation";

	useEffect(() => {
		if (!ready) router.replace("/pay");
	}, [ready, router]);

	if (!link || !verification || !ready) return null;

	return (
		<ExternalPaymentReconciliationStep
			link={link}
			verification={verification}
			onContactSupport={() => {
				reset();
				router.push("/support/contact");
			}}
			onGoToDashboard={() => {
				reset();
				router.push("/");
			}}
		/>
	);
}
