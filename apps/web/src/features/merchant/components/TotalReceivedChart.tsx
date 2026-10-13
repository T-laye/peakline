"use client";

import { useState } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from "recharts";
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

/**
 * Overview's "Total Received" chart — a real area chart (`recharts`) with a
 * period selector. Received-only again (2026-10-11 redesign): the new mock
 * puts this and the new `TransactionTrendChart` side by side as two
 * distinct cards rather than one combined received/sent view, so the
 * "Sent" series that used to share this chart moved out rather than being
 * dropped — `useReceivedTrend`'s own data still carries `outflow` per
 * point, now consumed by that sibling chart instead. No outer card on
 * mobile — the bordered/padded treatment is `lg`-only, so the chart itself
 * gets the full page width to work with there instead of losing it to a
 * card's padding.
 */
function TotalReceivedChart() {
	const [period, setPeriod] = useState<ReceivedTrendPeriod>("month");
	const { data } = useReceivedTrend(period);

	return (
		<div className="flex flex-col gap-4 lg:rounded-2xl lg:border lg:border-border lg:bg-background lg:p-6">
			<div className="flex items-start justify-between gap-4">
				<div className="flex min-w-0 flex-col gap-1">
					<span className="text-c1 text-muted-foreground lg:text-b3">Total Received</span>
					{data ? (
						<span className="text-h5 text-foreground lg:text-h4">
							{formatUsdc(data.totalInflow)} {data.currency}
						</span>
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
									formatter={(value) => [`${formatUsdc(Number(value))} USDC`, "Received"]}
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
							</AreaChart>
						</ResponsiveContainer>
					</div>
				)}
			</div>
		</div>
	);
}

export { TotalReceivedChart };
