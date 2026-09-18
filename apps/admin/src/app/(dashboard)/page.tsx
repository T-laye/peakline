import type { Metadata } from "next";
import { OverviewCards } from "@/features/analytics/components/OverviewCards";

export const metadata: Metadata = {
	title: "Overview — Peakline Admin",
};

export default function OverviewPage() {
	return (
		<div className="flex flex-col gap-6">
			<div className="flex flex-col gap-1">
				<h1 className="text-h4 text-foreground">Overview</h1>
				<p className="text-b3 text-muted-foreground">Platform-wide activity at a glance.</p>
			</div>
			<OverviewCards />
		</div>
	);
}
