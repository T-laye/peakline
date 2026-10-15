"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { ExternalPayStepHeader } from "@/features/pay/components/ExternalPayStepHeader";
import { ExternalTransactionStep } from "@/features/pay/components/ExternalTransactionStep";
import { usePayFlowStore } from "@/features/pay/store/payFlowStore";

export default function ExternalTransactionPage() {
	const router = useRouter();
	const link = usePayFlowStore((state) => state.link);
	const senderAddress = usePayFlowStore((state) => state.externalSenderAddress);
	const txHash = usePayFlowStore((state) => state.externalTxHash);
	const setTxHash = usePayFlowStore((state) => state.setExternalTxHash);

	useEffect(() => {
		if (!link) router.replace("/pay");
		else if (!senderAddress) router.replace("/pay/external");
	}, [link, senderAddress, router]);

	if (!link || !senderAddress) return null;

	return (
		<div className="flex flex-col gap-6 sm:gap-8">
			<ExternalPayStepHeader step={2} onBack={() => router.push("/pay/external")} />
			<ExternalTransactionStep
				link={link}
				senderAddress={senderAddress}
				defaultTxHash={txHash}
				onChangeWallet={() => router.push("/pay/external")}
				onVerify={(hash) => {
					setTxHash(hash);
					router.push("/pay/external/verifying");
				}}
			/>
		</div>
	);
}
