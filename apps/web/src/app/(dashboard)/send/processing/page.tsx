"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { TransferProcessingStep } from "@/features/send/components/TransferProcessingStep";
import { useSendMoneyFlowStore } from "@/features/send/store/sendMoneyFlowStore";

export default function TransferProcessingPage() {
	const router = useRouter();
	const values = useSendMoneyFlowStore((state) => state.values);
	const pin = useSendMoneyFlowStore((state) => state.pin);
	const setResult = useSendMoneyFlowStore((state) => state.setResult);
	const setErrorMessage = useSendMoneyFlowStore((state) => state.setErrorMessage);

	useEffect(() => {
		if (!values || !pin) router.replace("/send");
	}, [values, pin, router]);

	if (!values || !pin) return null;

	return (
		<TransferProcessingStep
			values={values}
			pin={pin}
			onSuccess={(result) => {
				setResult(result);
				router.replace("/send/success");
			}}
			onError={(message) => {
				setErrorMessage(message);
				router.replace("/send/failed");
			}}
		/>
	);
}
