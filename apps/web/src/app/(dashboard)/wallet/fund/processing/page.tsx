"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { FundingProcessingStep } from "@/features/wallet/components/FundingProcessingStep";
import { useFundWalletFlowStore } from "@/features/wallet/store/fundWalletFlowStore";

export default function FundingProcessingPage() {
	const router = useRouter();
	const quote = useFundWalletFlowStore((state) => state.quote);
	const setResult = useFundWalletFlowStore((state) => state.setResult);
	const setErrorMessage = useFundWalletFlowStore((state) => state.setErrorMessage);

	useEffect(() => {
		if (!quote) router.replace("/wallet/fund");
	}, [quote, router]);

	if (!quote) return null;

	return (
		<FundingProcessingStep
			quote={quote}
			onSuccess={(result) => {
				setResult(result);
				router.replace("/wallet/fund/success");
			}}
			onError={(message) => {
				setErrorMessage(message);
				router.replace("/wallet/fund/failed");
			}}
		/>
	);
}
