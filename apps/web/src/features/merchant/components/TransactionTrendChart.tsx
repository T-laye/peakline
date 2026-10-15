"use client";

import { useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from "recharts";
import { Select } from "@repo/ui/select";
import { Skeleton } from "@repo/ui/skeleton";
import { useReceivedTrend, type ReceivedTrendPeriod } from "@/features/merchant/hooks";
import { formatUsdc } from "@/lib/currency";

function formatYAxisTick(value: number) {
	return value >= 1000 ? `${value / 1000}K` : String(value);
}

const PERIOD_OPTIONS: { value: ReceivedTrendPeriod; label: string }[] = [
	{ value: "week", label: "This week" },
	{ value: "month", label: "This month" },
	{ value: "year", label: "This year" },
];

const MIN_PX_PER_POINT = 48;

/**
 * Overview's "Transaction Trend" bar chart (2026-10-11 redesign) — sits
 * beside `TotalReceivedChart`. The mock's bars imply a per-day *count* of
 * transactions, but no endpoint anywhere pairs a bucket with a transaction
 * count — `GET /merchant/dashboard/stats`'s `chart.buckets` only ever
 * carries `inflow`/`outflow` amounts (confirmed against the live API).
 * Rather than fabricate a count, this plots real data instead: each bar is
 * that bucket's total transacted volume (inflow + outflow), a genuine
 * "how much activity happened this day" measure built from numbers that
 * actually exist. Relabel or wire to a real count endpoint if/when the
 * backend adds one.
 */
function TransactionTrendChart() {
	const [period, setPeriod] = useState<ReceivedTrendPeriod>("week");
	const { data } = useReceivedTrend(period);

	const points = data?.points.map((point) => ({
		label: point.label,
		volume: point.inflow + point.outflow,
	}));

	return (
		<div className="flex flex-col gap-4 lg:rounded-2xl lg:border lg:border-border lg:bg-background lg:p-6">
			<div className="flex items-start justify-between gap-4">
				<span className="text-s1 text-foreground lg:text-h5">Transaction Trend</span>
				<Select
					value={period}
					onChange={(e) => setPeriod(e.target.value as ReceivedTrendPeriod)}
					aria-label="Transaction trend period"
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
				{!points ? (
					<Skeleton className="h-full w-full" />
				) : (
					<div className="h-full min-w-full" style={{ width: points.length * MIN_PX_PER_POINT }}>
						<ResponsiveContainer width="100%" height="100%">
							<BarChart data={points} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
								<CartesianGrid vertical={false} strokeDasharray="4 4" stroke="var(--color-border)" />
								<XAxis
									dataKey="label"
									axisLine={false}
									tickLine={false}
									interval={0}
									tick={{ fontSize: 12, fill: "var(--color-muted-foreground)" }}
								/>
								<YAxis
									axisLine={false}
									tickLine={false}
									tickFormatter={formatYAxisTick}
									width={40}
									tick={{ fontSize: 12, fill: "var(--color-muted-foreground)" }}
								/>
								<Tooltip
									formatter={(value) => [`${formatUsdc(Number(value))} USDC`, "Volume"]}
									contentStyle={{
										borderRadius: 8,
										borderColor: "var(--color-border)",
										fontSize: 13,
									}}
									cursor={{ fill: "var(--color-muted)" }}
								/>
								<Bar dataKey="volume" fill="var(--color-primary-500)" radius={[4, 4, 0, 0]} />
							</BarChart>
						</ResponsiveContainer>
					</div>
				)}
			</div>
		</div>
	);
}

export { TransactionTrendChart };
