"use client";

import { useState, type ReactNode } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from "recharts";
import { cn } from "@repo/ui/lib/utils";
import { Select } from "@repo/ui/select";
import { Skeleton } from "@repo/ui/skeleton";
import { useReceivedTrend, type ReceivedTrendPeriod } from "@/features/merchant/hooks";
import { formatUsdc } from "@/lib/currency";

function formatYAxisTick(value: number) {
	return value >= 1000 ? `${value / 1000}K` : String(value);
}

/** The x-axis label matching `selectedLabel` renders as a filled pill,
 * matching the mock, instead of plain text like every other tick. */
function MonthTick({
	x,
	y,
	payload,
	selectedLabel,
}: {
	x?: number;
	y?: number;
	payload?: { value: string };
	selectedLabel: string;
}) {
	const value = payload?.value ?? "";
	if (value === selectedLabel) {
		return (
			<g transform={`translate(${x},${y})`}>
				<rect x={-18} y={6} width={36} height={20} rx={10} className="fill-primary-500" />
				<text x={0} y={20} textAnchor="middle" className="fill-primary-foreground text-[11px] font-semibold">
					{value}
				</text>
			</g>
		);
	}
	return (
		<g transform={`translate(${x},${y})`}>
			<text x={0} y={20} textAnchor="middle" className="fill-muted-foreground text-[12px]">
				{value}
			</text>
		</g>
	);
}

const PERIOD_OPTIONS: { value: ReceivedTrendPeriod; label: string }[] = [
	{ value: "week", label: "This week" },
	{ value: "month", label: "This month" },
	{ value: "year", label: "This year" },
];

// Enough room per point that a tick label (a month name, "Week 3", etc.)
// never has to shrink or overlap its neighbors — "This year" (12 points)
// or a long "This month" (30+ daily points) used to all force-fit into
// whatever width the card had, compressing every label into an unreadable
// smear. Below this floor, the chart still fills the card's own width
// exactly (see `minWidth` below) rather than leaving dead space for a
// short "This week" (7 points).
const MIN_PX_PER_POINT = 56;

/** Small filled/outline dot + label used in both the header's inline
 * legend and (implicitly, via color) the two `Area` series below — keeps
 * the "which color means which direction" mapping in one place. */
function LegendDot({ colorClassName, children }: { colorClassName: string; children: ReactNode }) {
	return (
		<span className="flex items-center gap-1.5 text-c1 text-muted-foreground">
			<span className={cn("size-2 shrink-0 rounded-full", colorClassName)} aria-hidden="true" />
			{children}
		</span>
	);
}

/**
 * Overview's cash-flow section — a real area chart (`recharts`) with a
 * period selector, per the update. Both directions now (real as of
 * 2026-09-13, previously received-only): inflow in the app's primary
 * green, outflow in a muted neutral so received still reads as the hero
 * figure. No outer card on mobile — the bordered/padded treatment is
 * `lg`-only, so the chart itself gets the full page width to work with
 * there instead of losing it to a card's padding.
 */
function TotalReceivedChart() {
	const [period, setPeriod] = useState<ReceivedTrendPeriod>("month");
	const { data } = useReceivedTrend(period);

	return (
		<div className="flex flex-col gap-4 lg:rounded-2xl lg:border lg:border-border lg:bg-background lg:p-6">
			<div className="flex items-start justify-between gap-4">
				<div className="flex min-w-0 flex-col gap-1.5">
					<span className="text-c1 text-muted-foreground lg:text-b3">Cash Flow</span>
					{data ? (
						<div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
							<span className="text-h5 text-foreground lg:text-h4">
								{formatUsdc(data.totalInflow)} {data.currency}
							</span>
							<LegendDot colorClassName="bg-primary-500">Received</LegendDot>
							<LegendDot colorClassName="bg-neutral-400">
								{formatUsdc(data.totalOutflow)} {data.currency} Sent
							</LegendDot>
						</div>
					) : (
						<Skeleton className="h-9 w-40" />
					)}
				</div>
				<Select
					value={period}
					onChange={(e) => setPeriod(e.target.value as ReceivedTrendPeriod)}
					aria-label="Chart period"
					className="h-9 w-28 shrink-0 px-2.5 pr-8 text-c1 lg:h-11 lg:w-40 lg:px-3.5 lg:pr-10 lg:text-b1"
				>
					{PERIOD_OPTIONS.map((option) => (
						<option key={option.value} value={option.value}>
							{option.label}
						</option>
					))}
				</Select>
			</div>

			<div className="h-56 w-full overflow-x-auto sm:h-64">
				{!data ? (
					<Skeleton className="h-full w-full" />
				) : (
					<div
						className="h-full min-w-full"
						style={{ width: data.points.length * MIN_PX_PER_POINT }}
					>
						<ResponsiveContainer width="100%" height="100%">
							<AreaChart data={data.points} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
								<defs>
									<linearGradient id="totalReceivedFill" x1="0" y1="0" x2="0" y2="1">
										<stop offset="0%" stopColor="var(--color-primary-500)" stopOpacity={0.25} />
										<stop offset="100%" stopColor="var(--color-primary-500)" stopOpacity={0} />
									</linearGradient>
									<linearGradient id="totalSentFill" x1="0" y1="0" x2="0" y2="1">
										<stop offset="0%" stopColor="var(--color-neutral-400)" stopOpacity={0.2} />
										<stop offset="100%" stopColor="var(--color-neutral-400)" stopOpacity={0} />
									</linearGradient>
								</defs>
								<CartesianGrid vertical={false} strokeDasharray="4 4" stroke="var(--color-border)" />
								<XAxis
									dataKey="label"
									axisLine={false}
									tickLine={false}
									interval={0}
									tick={<MonthTick selectedLabel={data.selectedLabel} />}
								/>
								<YAxis
									axisLine={false}
									tickLine={false}
									tickFormatter={formatYAxisTick}
									width={40}
									tick={{ fontSize: 12, fill: "var(--color-muted-foreground)" }}
								/>
								<Tooltip
									formatter={(value, name) => [
										`${formatUsdc(Number(value))} USDC`,
										name === "inflow" ? "Received" : "Sent",
									]}
									contentStyle={{
										borderRadius: 8,
										borderColor: "var(--color-border)",
										fontSize: 13,
									}}
								/>
								<Area
									type="monotone"
									dataKey="inflow"
									stroke="var(--color-primary-600)"
									strokeWidth={2}
									fill="url(#totalReceivedFill)"
								/>
								<Area
									type="monotone"
									dataKey="outflow"
									stroke="var(--color-neutral-400)"
									strokeWidth={2}
									fill="url(#totalSentFill)"
								/>
							</AreaChart>
						</ResponsiveContainer>
					</div>
				)}
			</div>
		</div>
	);
}

export { TotalReceivedChart };
