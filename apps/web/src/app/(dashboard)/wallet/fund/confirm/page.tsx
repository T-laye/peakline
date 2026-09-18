"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { MobileStepHeader } from "@/features/wallet/components/MobileStepHeader";
import { ConfirmFundingStep } from "@/features/wallet/components/ConfirmFundingStep";
import { useFundWalletFlowStore } from "@/features/wallet/store/fundWalletFlowStore";

export default function ConfirmFundingPage() {
	const router = useRouter();
	const values = useFundWalletFlowStore((state) => state.values);
	const setQuote = useFundWalletFlowStore((state) => state.setQuote);

	// Reached without an amount chosen in this session — send back.
	useEffect(() => {
		if (!values) router.replace("/wallet/fund");
	}, [values, router]);

	if (!values) return null;

	return (
		<div className="flex flex-col gap-6">
			<MobileStepHeader
				title="Confirm Funding Details"
				onBack={() => router.push("/wallet/fund")}
			/>
			<ConfirmFundingStep
				values={values}
				onContinue={(quote) => {
					setQuote(quote);
					router.push("/wallet/fund/processing");
				}}
			/>
		</div>
	);
}
