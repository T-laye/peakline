"use client";

import { useRouter } from "next/navigation";
import { FileText } from "lucide-react";
import { StatusPage } from "@repo/ui/status-page";
import { MobileStepHeader } from "@/features/wallet/components/MobileStepHeader";

export default function PrivacyPolicyPage() {
	const router = useRouter();

	return (
		<div className="flex flex-1 flex-col">
			<MobileStepHeader title="Privacy Policy" onBack={() => router.back()} />
			<StatusPage
				icon={FileText}
				title="Privacy Policy"
				description="This page isn't published yet — check back soon."
			/>
		</div>
	);
}
