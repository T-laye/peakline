"use client";

import { useRouter } from "next/navigation";
import { MobileStepHeader } from "@/features/wallet/components/MobileStepHeader";
import { FundWalletFormStep } from "@/features/wallet/components/FundWalletFormStep";
import { useFundWalletFlowStore } from "@/features/wallet/store/fundWalletFlowStore";

export default function FundWalletPage() {
	const router = useRouter();
	const values = useFundWalletFlowStore((state) => state.values);
	const setValues = useFundWalletFlowStore((state) => state.setValues);

	return (
		<div className="flex flex-col gap-6">
			<MobileStepHeader title="Fund Wallet" onBack={() => router.push("/")} />
			<FundWalletFormStep
				defaultValues={values}
				onContinue={(submitted) => {
					setValues(submitted);
					router.push("/wallet/fund/confirm");
				}}
			/>
		</div>
	);
}
