"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { TransferSuccessStep } from "@/features/send/components/TransferSuccessStep";
import { useSendMoneyFlowStore } from "@/features/send/store/sendMoneyFlowStore";

export default function TransferSuccessPage() {
	const router = useRouter();
	const result = useSendMoneyFlowStore((state) => state.result);
	const reset = useSendMoneyFlowStore((state) => state.reset);

	useEffect(() => {
		if (!result) router.replace("/send");
	}, [result, router]);

	if (!result) return null;

	function goToDashboard() {
		reset();
		router.push("/");
	}

	function viewTransactions() {
		reset();
		router.push("/transactions");
	}

	return (
		<TransferSuccessStep
			result={result}
			onGoToDashboard={goToDashboard}
			onViewTransactions={viewTransactions}
		/>
	);
}
