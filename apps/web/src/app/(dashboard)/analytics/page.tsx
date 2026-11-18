import type { Metadata } from "next";
import { PageHeader } from "@/components/layouts/PageHeader";
import { AnalyticsOverview } from "@/features/merchant/components/AnalyticsOverview";
import { DownloadSummaryButton } from "@/features/analytics/components/DownloadSummaryButton";

export const metadata: Metadata = {
	title: "Analytics — Peakline",
};

export default function AnalyticsPage() {
	return (
		<div className="flex flex-col gap-6 sm:gap-8">
			<PageHeader
				title="Analytics"
				subtitle="Get quick insight into how your business transactions are doing."
				action={<DownloadSummaryButton />}
			/>
			<DownloadSummaryButton className="w-full lg:hidden" />
			<AnalyticsOverview />
		</div>
	);
}
