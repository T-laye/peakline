import type { Metadata } from "next";
import { BusinessesList } from "@/features/businesses/components/BusinessesList";

export const metadata: Metadata = { title: "Businesses — Peakline Admin" };

export default function BusinessesPage() {
	return (
		<div className="flex flex-col gap-6">
			<div className="flex flex-col gap-1">
				<h1 className="text-h4 text-foreground">Businesses</h1>
				<p className="text-b3 text-muted-foreground">Every registered merchant business.</p>
			</div>
			<BusinessesList />
		</div>
	);
}
