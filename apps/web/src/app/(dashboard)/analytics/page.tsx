import type { Metadata } from "next";
import { PageHeader } from "@/components/layouts/PageHeader";
import { AnalyticsOverview } from "@/features/merchant/components/AnalyticsOverview";

export const metadata: Metadata = {
	title: "Analytics — Peakline",
};

export default function AnalyticsPage() {
	return (
		<div className="flex flex-col gap-6 sm:gap-8">
			<PageHeader
				title="Analytics"
				subtitle="Get quick insight into how your business transactions are doing."
			/>
			<AnalyticsOverview />
		</div>
	);
}
