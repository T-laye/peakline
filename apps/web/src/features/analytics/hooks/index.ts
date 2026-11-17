import { useQuery } from "@tanstack/react-query";
import type { ReceivedTrendPeriod } from "@/features/merchant/hooks";
import { mockPaymentRequests } from "@/features/payment-requests/hooks/mockData";
import { mockPayments, mockRefunds } from "@/features/refunds/hooks/mockData";

/*
 * Third-tranche reporting (c7 Analytics) — **mock-derived** until the
 * backend's reporting summaries exist (the brief lists "generate merchant
 * reporting summaries" under backend work). Everything here is computed
 * from the payment-request and refund mock stores so the figures stay
 * consistent with those screens. Real-API figures (total received, pending,
 * the two original charts) still come from `features/merchant/hooks`.
 */

export interface AmountCount {
	amount: number;
	count: number;
}

export interface SeriesPoint {
	label: string;
	value: number;
}

export interface ReportSummary {
	completedCollections: AmountCount;
	refundsCompleted: AmountCount;
	outstandingRequests: AmountCount;
	qrVolume: AmountCount;
	paymentLinkVolume: AmountCount;
	paymentRequestVolume: AmountCount;
	usdcVolume: AmountCount;
}

function sum<T>(items: T[], amount: (item: T) => string): AmountCount {
	return { amount: items.reduce((s, i) => s + Number(amount(i)), 0), count: items.length };
}

function buildSummary(): ReportSummary {
	const completedRefunds = mockRefunds.filter((r) => r.status === "completed");
	const byMethod = (method: string) => mockPayments.filter((p) => p.method === method);
	const payments = sum(mockPayments, (p) => p.amount);
	const refunds = sum(completedRefunds, (r) => r.amount);
	return {
		completedCollections: sum(
			mockPaymentRequests.filter((r) => r.status === "paid"),
			(r) => r.amount,
		),
		refundsCompleted: refunds,
		outstandingRequests: sum(
			mockPaymentRequests.filter((r) => r.status === "pending" || r.status === "processing"),
			(r) => r.amount,
		),
		qrVolume: sum(byMethod("qr"), (p) => p.amount),
		paymentLinkVolume: sum(byMethod("payment_link"), (p) => p.amount),
		paymentRequestVolume: sum(byMethod("payment_request"), (p) => p.amount),
		usdcVolume: { amount: payments.amount + refunds.amount, count: payments.count + refunds.count },
	};
}

function useReportSummary() {
	return useQuery({
		staleTime: 0,
		queryKey: ["merchant", "report", "summary"],
		queryFn: async () => {
			await new Promise((r) => setTimeout(r, 300));
			return buildSummary();
		},
	});
}

const DAY = 86_400_000;
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/** Week → last 7 days; month → last 5 weeks; year → 12 months to date. */
function buckets(period: ReceivedTrendPeriod) {
	const now = new Date();
	if (period === "week") {
		return Array.from({ length: 7 }, (_, i) => {
			const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - (6 - i));
			return { label: WEEKDAYS[start.getDay()]!, start: start.getTime(), end: start.getTime() + DAY };
		});
	}
	if (period === "month") {
		const end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).getTime();
		return Array.from({ length: 5 }, (_, i) => ({
			label: `Wk ${i + 1}`,
			start: end - (5 - i) * 7 * DAY,
			end: end - (4 - i) * 7 * DAY,
		}));
	}
	return Array.from({ length: 12 }, (_, i) => {
		const start = new Date(now.getFullYear(), i, 1);
		const end = new Date(now.getFullYear(), i + 1, 1);
		return { label: MONTHS[i]!, start: start.getTime(), end: end.getTime() };
	});
}

function series<T>(items: T[], at: (i: T) => string, amount: (i: T) => string, period: ReceivedTrendPeriod) {
	return buckets(period).map((b) => ({
		label: b.label,
		value: items
			.filter((i) => {
				const t = new Date(at(i)).getTime();
				return t >= b.start && t < b.end;
			})
			.reduce((s, i) => s + Number(amount(i)), 0),
	}));
}

export type ReportSeriesKind = "refunds" | "outstanding";

function useReportSeries(kind: ReportSeriesKind, period: ReceivedTrendPeriod) {
	return useQuery({
		staleTime: 0,
		queryKey: ["merchant", "report", "series", kind, period],
		queryFn: async (): Promise<{ total: number; points: SeriesPoint[] }> => {
			await new Promise((r) => setTimeout(r, 300));
			const points =
				kind === "refunds"
					? series(mockRefunds.filter((r) => r.status === "completed"), (r) => r.createdAt, (r) => r.amount, period)
					: series(
							mockPaymentRequests.filter((r) => r.status === "pending" || r.status === "processing"),
							(r) => r.createdAt,
							(r) => r.amount,
							period,
						);
			return { total: points.reduce((s, p) => s + p.value, 0), points };
		},
	});
}

export type BreakdownKind = "methods" | "collections_vs_refunds";

function useReportBreakdown(kind: BreakdownKind, period: ReceivedTrendPeriod) {
	return useQuery({
		staleTime: 0,
		queryKey: ["merchant", "report", "breakdown", kind, period],
		queryFn: async (): Promise<SeriesPoint[]> => {
			await new Promise((r) => setTimeout(r, 300));
			const range = buckets(period);
			const from = range[0]!.start;
			const inRange = (iso: string) => new Date(iso).getTime() >= from;
			if (kind === "methods") {
				const payments = mockPayments.filter((p) => inRange(p.paidAt));
				const total = (method: string) =>
					payments.filter((p) => p.method === method).reduce((s, p) => s + Number(p.amount), 0);
				return [
					{ label: "QR", value: total("qr") },
					{ label: "Payment Link", value: total("payment_link") },
					{ label: "Payment Request", value: total("payment_request") },
				];
			}
			return [
				{
					label: "Collections",
					value: mockPayments.filter((p) => inRange(p.paidAt)).reduce((s, p) => s + Number(p.amount), 0),
				},
				{
					label: "Refunds",
					value: mockRefunds
						.filter((r) => r.status === "completed" && inRange(r.createdAt))
						.reduce((s, r) => s + Number(r.amount), 0),
				},
			];
		},
	});
}

export { useReportSummary, useReportSeries, useReportBreakdown };
