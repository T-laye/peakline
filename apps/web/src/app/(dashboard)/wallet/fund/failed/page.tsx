"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { MobileStepHeader } from "@/features/wallet/components/MobileStepHeader";
import { FundingFailedStep } from "@/features/wallet/components/FundingFailedStep";
import { useFundWalletFlowStore } from "@/features/wallet/store/fundWalletFlowStore";

export default function FundingFailedPage() {
	const router = useRouter();
	const values = useFundWalletFlowStore((state) => state.values);
	const errorMessage = useFundWalletFlowStore((state) => state.errorMessage);
	const reset = useFundWalletFlowStore((state) => state.reset);

	useEffect(() => {
		if (!values || !errorMessage) router.replace("/wallet/fund");
	}, [values, errorMessage, router]);

	if (!values || !errorMessage) return null;

	function goToDashboard() {
		reset();
		router.push("/");
	}

	return (
		<div className="flex flex-col gap-6">
			<MobileStepHeader title="Fund Wallet" onBack={goToDashboard} />
			<FundingFailedStep
				amount={values.amount}
				errorMessage={errorMessage}
				onTryAgain={() => router.push("/wallet/fund/confirm")}
				onGoToDashboard={goToDashboard}
			/>
		</div>
	);
}
