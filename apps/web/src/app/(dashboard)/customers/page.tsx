import type { Metadata } from "next";
import { Users } from "lucide-react";
import { EmptyState } from "@repo/ui/empty-state";
import { PageHeader } from "@/components/layouts/PageHeader";

export const metadata: Metadata = {
	title: "Customers — Peakline",
};

/** No design for this page yet (2026-10-11 redesign added the nav slot
 * before the screen behind it) — a real placeholder rather than a 404, so
 * the nav item isn't a dead link while the design is still coming. Replace
 * with the real screen once it lands. */
export default function CustomersPage() {
	return (
		<div className="flex flex-col gap-6 sm:gap-8">
			<PageHeader title="Customers" subtitle="Everyone who's paid you." />
			<div className="rounded-2xl border border-border bg-background">
				<EmptyState
					icon={Users}
					title="Coming soon"
					description="Customer management is on its way — check back shortly."
				/>
			</div>
		</div>
	);
}
