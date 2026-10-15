"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { ExternalPaymentVerifiedStep } from "@/features/pay/components/ExternalPaymentVerifiedStep";
import { usePayFlowStore } from "@/features/pay/store/payFlowStore";

export default function ExternalPaymentVerifiedPage() {
	const router = useRouter();
	const link = usePayFlowStore((state) => state.link);
	const verification = usePayFlowStore((state) => state.verification);
	const txHash = usePayFlowStore((state) => state.externalTxHash);
	const reset = usePayFlowStore((state) => state.reset);

	const ready = link && verification?.status === "settled";

	useEffect(() => {
		if (!ready) router.replace("/pay");
	}, [ready, router]);

	if (!link || !verification || !ready) return null;

	return (
		<ExternalPaymentVerifiedStep
			link={link}
			claim={verification}
			txHash={txHash ?? ""}
			onGoToDashboard={() => {
				reset();
				router.push("/");
			}}
		/>
	);
}
