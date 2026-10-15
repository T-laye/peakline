"use client";

import { TrendingDown, TrendingUp } from "lucide-react";
import { cn } from "@repo/ui/lib/utils";
import { Skeleton } from "@repo/ui/skeleton";
import { useMerchantOverview } from "@/features/merchant/hooks";
import { formatUsdc } from "@/lib/currency";

function StatCardSkeleton() {
	return (
		<div className="flex min-w-0 flex-col gap-3 rounded-2xl border border-border bg-background p-5 sm:p-6">
			<Skeleton className="h-4 w-28" />
			<Skeleton className="h-8 w-32" />
			<Skeleton className="h-4 w-24" />
		</div>
	);
}

function ChangeIndicator({ pct, label }: { pct: number | null; label: string }) {
	// `changePct` is null when the comparison baseline was 0 (the real
	// endpoint's own documented behavior) — nothing meaningful to show a
	// percent change against, so this renders neither the icon nor a
	// misleading 0%/blank number.
	if (pct === null) {
		return <span className="text-c1 text-muted-foreground">{label}</span>;
	}
	// Real data includes negative `changePct` (a genuine drop, e.g.
	// today's payments down 58.6% vs yesterday) — this used to always
	// render an up arrow in success green regardless of sign, which lied
	// about a decrease. Down now gets a down arrow in destructive red.
	const isDown = pct < 0;
	const Icon = isDown ? TrendingDown : TrendingUp;
	return (
		// `flex-wrap` — reported live as distorting on narrow cards: "58.6%
		// vs previous month" has no reason to force itself onto one line,
		// and CSS Grid would otherwise let it push the card wider than its
		// column. Wrapping it costs nothing (the row above already reserves
		// two lines' worth of height whenever the amount itself wraps).
		<span
			className={cn(
				"flex flex-wrap items-center gap-x-1 gap-y-0.5 text-c1",
				isDown ? "text-destructive" : "text-success",
			)}
		>
			<Icon className="size-3.5 shrink-0" aria-hidden="true" />
			<span>
				{Math.abs(pct)}% {label}
			</span>
		</span>
	);
}

function StatCard({
	label,
	amount,
	currency,
	pct,
	changeLabel,
}: {
	label: string;
	amount: number;
	currency: string;
	pct: number | null;
	changeLabel: string;
}) {
	return (
		// `min-w-0` is the actual fix, not decoration — Tailwind's `grid-cols-*`
		// already caps each column at its track width (`minmax(0, 1fr)`), but
		// a grid ITEM's own default `min-width: auto` still sizes it to fit
		// its content's min-content width. A long unbroken number (a comma
		// isn't a line-break opportunity) has nowhere to wrap without this,
		// so it overflows straight past the card's border into whatever sits
		// next to it — reported live as the cards "distorting" once a larger
		// amount landed in one, on both small and large screens (a 5-across
		// desktop row leaves just as little width per card as a 2-across
		// mobile row does). `wrap-break-word` on the amount is the second half:
		// once the item can actually shrink, this lets the number itself
		// wrap (or, as a last resort for a truly huge one, break mid-digit)
		// instead of hitting that same wall one level down.
		<div className="flex min-w-0 flex-col gap-2 rounded-2xl border border-border bg-background p-5 sm:p-6">
			<span className="truncate text-b3 text-muted-foreground" title={label}>
				{label}
			</span>
			<span className="wrap-break-word text-h5 text-foreground sm:text-h4">
				{formatUsdc(amount)} {currency}
			</span>
			<ChangeIndicator pct={pct} label={changeLabel} />
		</div>
	);
}

/**
 * Merchant Overview's headline numbers — analytics-flavored, unlike the
 * individual dashboard's single `BalanceCard`. The mock shows these with a
 * "$" prefix; kept to the app's own "amount USDC" convention instead (see
 * `formatUsdc`/`BalanceCard`) rather than introducing a one-off dollar-sign
 * format nowhere else in the app uses. Real as of `GET /merchant/dashboard/stats`
 * — the comparison label under each stat reflects what it's actually
 * compared against ("vs previous month" / "vs yesterday").
 *
 * Back to three cards (2026-10-11 redesign) — the new mock's middle card is
 * labelled "Confirmed Payments" with a transaction count underneath
 * ("From 102 Transactions"), matching the same shape as `Pending`. No real
 * endpoint pairs an amount with a transaction count for anything but
 * `pending`, though — `totalReceived`/`todaysPayments`/etc. only ever carry
 * `amount` + `changePct` (confirmed against the live API). Rather than
 * invent a count the backend doesn't give us, this keeps the card backed by
 * a real field (`todaysPayments`) and its own real comparison, labelled for
 * what it actually is. `totalSent`/`todaySent` still exist on the data layer
 * (`useMerchantOverview`) for whenever a screen needs the outflow side —
 * just not shown here now that the mock dropped them from Overview.
 */
function MerchantStatsCards() {
	const { data } = useMerchantOverview();

	if (!data) {
		return (
			<div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
				<StatCardSkeleton />
				<StatCardSkeleton />
				<StatCardSkeleton />
			</div>
		);
	}

	return (
		<div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
			<StatCard
				label="Total Received"
				amount={data.totalReceived}
				currency={data.currency}
				pct={data.totalReceivedChangePct}
				changeLabel={data.totalReceivedChangeLabel}
			/>
			<StatCard
				label="Today's Payments"
				amount={data.todaysPayments}
				currency={data.currency}
				pct={data.todaysPaymentsChangePct}
				changeLabel={data.todaysPaymentsChangeLabel}
			/>

			<div className="flex min-w-0 flex-col gap-2 rounded-2xl border border-border bg-background p-5 sm:p-6">
				<span className="text-b3 text-muted-foreground">Pending</span>
				<span className="wrap-break-word text-h5 text-destructive sm:text-h4">
					{formatUsdc(data.pending)} {data.currency}
				</span>
				<span className="text-c1 text-muted-foreground">
					{data.pendingCount} Transaction{data.pendingCount === 1 ? "" : "s"}
				</span>
			</div>
		</div>
	);
}

export { MerchantStatsCards };
