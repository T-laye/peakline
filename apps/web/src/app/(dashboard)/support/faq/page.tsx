"use client";

import { useRouter } from "next/navigation";
import { HelpCircle } from "lucide-react";
import { StatusPage } from "@repo/ui/status-page";
import { MobileStepHeader } from "@/features/wallet/components/MobileStepHeader";

export default function FaqPage() {
	const router = useRouter();

	return (
		<div className="flex flex-1 flex-col">
			<MobileStepHeader title="FAQ" onBack={() => router.back()} />
			<StatusPage
				icon={HelpCircle}
				title="FAQ"
				description="Frequently asked questions aren't published yet — check back soon."
			/>
		</div>
	);
}
