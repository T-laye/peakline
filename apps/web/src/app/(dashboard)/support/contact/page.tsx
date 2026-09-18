"use client";

import { useRouter } from "next/navigation";
import { Headphones } from "lucide-react";
import { StatusPage } from "@repo/ui/status-page";
import { MobileStepHeader } from "@/features/wallet/components/MobileStepHeader";

export default function ContactSupportPage() {
	const router = useRouter();

	return (
		<div className="flex flex-1 flex-col">
			<MobileStepHeader title="Contact Support" onBack={() => router.back()} />
			<StatusPage
				icon={Headphones}
				title="Contact Support"
				description="Live support isn't available yet — check back soon."
			/>
		</div>
	);
}
