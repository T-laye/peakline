"use client";

import { useState } from "react";
import {
	Area,
	AreaChart,
	Bar,
	BarChart,
	CartesianGrid,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts";
import { Select } from "@repo/ui/select";
import { Skeleton } from "@repo/ui/skeleton";
import type { ReceivedTrendPeriod } from "@/features/merchant/hooks";
import {
	useReportBreakdown,
	useReportSeries,
	type BreakdownKind,
	type ReportSeriesKind,
} from "@/features/analytics/hooks";
import { formatUsdc } from "@/lib/currency";

const PERIOD_OPTIONS: { value: ReceivedTrendPeriod; label: string }[] = [
	{ value: "week", label: "This week" },
	{ value: "month", label: "This month" },
	{ value: "year", label: "This year" },
];

const TOOLTIP_STYLE = { borderRadius: 8, borderColor: "var(--color-border)", fontSize: 13 };
const TICK = { fontSize: 12, fill: "var(--color-muted-foreground)" };

function formatYAxisTick(value: number) {
	return value >= 1000 ? `${value / 1000}K` : String(value);
}

function PeriodSelect({
	value,
	onChange,
	label,
}: {
	value: ReceivedTrendPeriod;
	onChange: (value: ReceivedTrendPeriod) => void;
	label: string;
}) {
	return (
		<Select
			value={value}
			onChange={(e) => onChange(e.target.value as ReceivedTrendPeriod)}
			aria-label={label}
			className="h-9 w-28 shrink-0 px-2.5 pr-8 text-c1 lg:h-11 lg:w-40 lg:px-3.5 lg:pr-10 lg:text-b1"
		>
			{PERIOD_OPTIONS.map((option) => (
				<option key={option.value} value={option.value}>
					{option.label}
				</option>
			))}
		</Select>
	);
}

const CARD = "flex flex-col gap-4 lg:rounded-2xl lg:border lg:border-border lg:bg-background lg:p-6";

/** Area chart with a headline total — same look as `TotalReceivedChart`,
 * for the v3 "Refund Volume Over Time" and "Outstanding collections over
 * time" cards. */
function ReportAreaChart({ kind, title }: { kind: ReportSeriesKind; title: string }) {
	const [period, setPeriod] = useState<ReceivedTrendPeriod>("month");
	const { data } = useReportSeries(kind, period);
	const gradientId = `report-${kind}-fill`;

	return (
		<div className={CARD}>
			<div className="flex items-start justify-between gap-4">
				<div className="flex min-w-0 flex-col gap-1">
					<span className="text-c1 text-muted-foreground lg:text-b3">{title}</span>
					{data ? (
						<span className="text-h5 text-foreground lg:text-h4">{formatUsdc(data.total)} USDC</span>
					) : (
						<Skeleton className="h-9 w-40" />
					)}
				</div>
				<PeriodSelect value={period} onChange={setPeriod} label={`${title} period`} />
			</div>
			<div className="h-56 w-full sm:h-64">
				{!data ? (
					<Skeleton className="h-full w-full" />
				) : (
					<ResponsiveContainer width="100%" height="100%">
						<AreaChart data={data.points} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
							<defs>
								<linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
									<stop offset="0%" stopColor="var(--color-primary-500)" stopOpacity={0.25} />
									<stop offset="100%" stopColor="var(--color-primary-500)" stopOpacity={0} />
								</linearGradient>
							</defs>
							<CartesianGrid vertical={false} strokeDasharray="4 4" stroke="var(--color-border)" />
							<XAxis dataKey="label" axisLine={false} tickLine={false} interval={0} tick={TICK} />
							<YAxis axisLine={false} tickLine={false} tickFormatter={formatYAxisTick} width={40} tick={TICK} />
							<Tooltip formatter={(value) => [`${formatUsdc(Number(value))} USDC`, title]} contentStyle={TOOLTIP_STYLE} />
							<Area
								type="monotone"
								dataKey="value"
								stroke="var(--color-primary-600)"
								strokeWidth={2}
								fill={`url(#${gradientId})`}
							/>
						</AreaChart>
					</ResponsiveContainer>
				)}
			</div>
		</div>
	);
}

/** Category bar chart — "Payment Methods" and "Collections vs Refunds". */
function ReportBarChart({ kind, title }: { kind: BreakdownKind; title: string }) {
	const [period, setPeriod] = useState<ReceivedTrendPeriod>("month");
	const { data } = useReportBreakdown(kind, period);

	return (
		<div className={CARD}>
			<div className="flex items-start justify-between gap-4">
				<span className="text-s1 text-foreground lg:text-h5">{title}</span>
				<PeriodSelect value={period} onChange={setPeriod} label={`${title} period`} />
			</div>
			<div className="h-56 w-full sm:h-64">
				{!data ? (
					<Skeleton className="h-full w-full" />
				) : (
					<ResponsiveContainer width="100%" height="100%">
						<BarChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
							<CartesianGrid vertical={false} strokeDasharray="4 4" stroke="var(--color-border)" />
							<XAxis dataKey="label" axisLine={false} tickLine={false} interval={0} tick={TICK} />
							<YAxis axisLine={false} tickLine={false} tickFormatter={formatYAxisTick} width={40} tick={TICK} />
							<Tooltip
								formatter={(value) => [`${formatUsdc(Number(value))} USDC`, "Volume"]}
								contentStyle={TOOLTIP_STYLE}
								cursor={{ fill: "var(--color-muted)" }}
							/>
							<Bar dataKey="value" fill="var(--color-primary-500)" radius={[4, 4, 0, 0]} maxBarSize={72} />
						</BarChart>
					</ResponsiveContainer>
				)}
			</div>
		</div>
	);
}

export { ReportAreaChart, ReportBarChart };
