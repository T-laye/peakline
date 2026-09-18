import type { Metadata } from "next";
import { DashboardOverview } from "@/features/dashboard/components/DashboardOverview";

export const metadata: Metadata = {
	title: "Dashboard — Peakline",
};

export default function DashboardPage() {
	return <DashboardOverview />;
}
