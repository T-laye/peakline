"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { SendStepHeader } from "@/features/send/components/SendStepHeader";
import { ReviewTransferStep } from "@/features/send/components/ReviewTransferStep";
import { useSendMoneyFlowStore } from "@/features/send/store/sendMoneyFlowStore";

export default function ReviewTransferPage() {
	const router = useRouter();
	const values = useSendMoneyFlowStore((state) => state.values);
	const setPin = useSendMoneyFlowStore((state) => state.setPin);

	// Reached without a recipient/amount chosen in this session — send back.
	useEffect(() => {
		if (!values) router.replace("/send");
	}, [values, router]);

	if (!values) return null;

	return (
		<div className="flex flex-col gap-6 sm:gap-8">
			<SendStepHeader step={2} onBack={() => router.push("/send")} />
			<ReviewTransferStep
				values={values}
				onContinue={(pin) => {
					setPin(pin);
					router.push("/send/processing");
				}}
			/>
		</div>
	);
}
