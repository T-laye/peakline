"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { TransferFailedStep } from "@/features/send/components/TransferFailedStep";
import { useSendMoneyFlowStore } from "@/features/send/store/sendMoneyFlowStore";

export default function TransferFailedPage() {
	const router = useRouter();
	const values = useSendMoneyFlowStore((state) => state.values);
	const errorMessage = useSendMoneyFlowStore((state) => state.errorMessage);
	const reset = useSendMoneyFlowStore((state) => state.reset);

	useEffect(() => {
		if (!values || !errorMessage) router.replace("/send");
	}, [values, errorMessage, router]);

	if (!values || !errorMessage) return null;

	function goToDashboard() {
		reset();
		router.push("/");
	}

	return (
		<TransferFailedStep
			amount={values.amount}
			errorMessage={errorMessage}
			onTryAgain={() => router.push("/send/review")}
			onGoToDashboard={goToDashboard}
		/>
	);
}
