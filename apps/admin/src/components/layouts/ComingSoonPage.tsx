import { Construction } from "lucide-react";
import { EmptyState } from "@repo/ui/empty-state";

/** Placeholder for a nav destination not built yet — see the phased build
 * plan (Phase 1: Users/Businesses/Transactions/Audit Log read-only; Phase
 * 2: user/business actions; Phase 3: Wallets/Ledger ops; Phase 4: Payment
 * Links/Config/Staff, the last of which landed too, so nothing currently
 * renders this). Kept for the next phase this plan doesn't have yet,
 * rather than deleted — keeps the full nav click-through-able instead of
 * 404ing or hiding an item that isn't wired up yet, the same reason it
 * existed from Phase 0 on. */
function ComingSoonPage({ title, phase }: { title: string; phase: string }) {
	return (
		<div className="flex flex-col gap-6">
			<div className="flex flex-col gap-1">
				<h1 className="text-h4 text-foreground">{title}</h1>
			</div>
			<div className="rounded-2xl border border-border bg-background">
				<EmptyState
					icon={Construction}
					title="Coming soon"
					description={`${title} management is planned for ${phase} — not built yet.`}
				/>
			</div>
		</div>
	);
}

export { ComingSoonPage };
