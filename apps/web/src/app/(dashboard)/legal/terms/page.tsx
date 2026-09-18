"use client";

import { useRouter } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { StatusPage } from "@repo/ui/status-page";
import { MobileStepHeader } from "@/features/wallet/components/MobileStepHeader";

export default function TermsPage() {
	const router = useRouter();

	return (
		<div className="flex flex-1 flex-col">
			<MobileStepHeader title="Terms and Conditions" onBack={() => router.back()} />
			<StatusPage
				icon={ShieldCheck}
				title="Terms and Conditions"
				description="This page isn't published yet — check back soon."
			/>
		</div>
	);
}
