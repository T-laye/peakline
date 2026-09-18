"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { PaymentSuccessStep } from "@/features/pay/components/PaymentSuccessStep";
import { usePayFlowStore } from "@/features/pay/store/payFlowStore";

export default function PaymentSuccessPage() {
	const router = useRouter();
	const link = usePayFlowStore((state) => state.link);
	const result = usePayFlowStore((state) => state.result);
	const reset = usePayFlowStore((state) => state.reset);

	useEffect(() => {
		if (!link || !result) router.replace("/pay");
	}, [link, result, router]);

	if (!link || !result) return null;

	function goToDashboard() {
		reset();
		router.push("/");
	}

	function viewTransactions() {
		reset();
		router.push("/transactions");
	}

	return (
		<PaymentSuccessStep
			link={link}
			result={result}
			onGoToDashboard={goToDashboard}
			onViewTransactions={viewTransactions}
		/>
	);
}
