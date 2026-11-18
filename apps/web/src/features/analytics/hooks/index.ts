import { useQuery } from "@tanstack/react-query";
import { useAxiosAuth } from "@/hooks/useAxiosAuth";
import { apiRoutes } from "@/lib/config/apiRoutes";
import type { ReceivedTrendPeriod } from "@/features/merchant/hooks";
import type {
	ActivityBucketData,
	ApiSuccessResponse,
	MerchantDashboardStatsData,
	MerchantReportData,
	PaymentMethodBreakdownData,
	PaymentMethodKind,
} from "@/lib/api/types";

/*
 * Merchant reporting (v3 API, frontend-integration.md §7). All figures are
 * scoped to the merchant's businesses (personal wallet excluded).
 */

export interface SeriesPoint {
	label: string;
	value: number;
}

/** A chart period selector value → an ISO `from` bound (rolling window). */
function periodFrom(period: ReceivedTrendPeriod) {
	const days = period === "week" ? 7 : period === "month" ? 30 : 365;
	return new Date(Date.now() - days * 86_400_000).toISOString();
}

/** Lower bound meaning "all time" for the reports endpoints, which
 * otherwise default to the last 30 days. */
const ALL_TIME_FROM = "2020-01-01T00:00:00.000Z";

/** Dashboard stats for a period (cards use the all-time totals; the
 * refunds chart uses `chart.buckets[].refunds`). */
function useDashboardStats(period: ReceivedTrendPeriod) {
	const axiosAuth = useAxiosAuth();

	return useQuery({
		queryKey: ["merchant", "dashboard-stats", period],
		queryFn: async () => {
			const { data } = await axiosAuth.get<ApiSuccessResponse<MerchantDashboardStatsData>>(
				apiRoutes.merchant.DASHBOARD_STATS,
				{ params: { period } },
			);
			return data.data;
		},
		staleTime: 0,
		refetchInterval: 30_000,
	});
}

function usePaymentMethods(from: string) {
	const axiosAuth = useAxiosAuth();

	return useQuery({
		queryKey: ["merchant", "report", "payment-methods", from],
		queryFn: async () => {
			const { data } = await axiosAuth.get<ApiSuccessResponse<PaymentMethodBreakdownData[]>>(
				apiRoutes.merchant.REPORT_PAYMENT_METHODS,
				{ params: { from } },
			);
			return data.data;
		},
	});
}

/** All-time amount/count per method, keyed by method. */
function useAllTimePaymentMethods() {
	const query = usePaymentMethods(ALL_TIME_FROM);
	const byMethod = (method: PaymentMethodKind) => {
		const row = query.data?.find((m) => m.method === method);
		return { amount: Number(row?.amount ?? 0), count: row?.count ?? 0 };
	};
	return { ...query, byMethod: query.data ? byMethod : undefined };
}

export const METHOD_LABEL: Record<PaymentMethodKind, string> = {
	payment_request: "Payment Request",
	payment_link: "Payment Link",
	funding_intent: "QR",
	direct_stellar: "Direct",
};

function usePaymentMethodSeries(period: ReceivedTrendPeriod) {
	const query = usePaymentMethods(periodFrom(period));
	const points: SeriesPoint[] | undefined = query.data
		? (Object.keys(METHOD_LABEL) as PaymentMethodKind[]).map((method) => ({
				label: METHOD_LABEL[method],
				value: Number(query.data.find((m) => m.method === method)?.amount ?? 0),
			}))
		: undefined;
	return { ...query, points };
}

function useRefundSeries(period: ReceivedTrendPeriod) {
	const query = useDashboardStats(period);
	const chart = query.data?.chart;
	return {
		...query,
		total: chart ? Number(chart.totalRefunds) : undefined,
		points: chart?.buckets.map((b) => ({ label: b.label, value: Number(b.refunds) })),
	};
}

function formatBucketLabel(iso: string, granularity: "day" | "month") {
	const d = new Date(iso);
	return granularity === "month"
		? d.toLocaleDateString(undefined, { month: "short", timeZone: "UTC" })
		: d.toLocaleDateString(undefined, { day: "numeric", month: "short", timeZone: "UTC" });
}

/** Net collections (payments − refunds) per day, or per month for a year. */
function useNetSeries(period: ReceivedTrendPeriod) {
	const axiosAuth = useAxiosAuth();
	const granularity = period === "year" ? "month" : "day";

	return useQuery({
		queryKey: ["merchant", "report", "activity", period],
		queryFn: async () => {
			const { data } = await axiosAuth.get<ApiSuccessResponse<ActivityBucketData[]>>(
				apiRoutes.merchant.REPORT_ACTIVITY,
				{ params: { from: periodFrom(period), granularity } },
			);
			const points: SeriesPoint[] = data.data.map((b) => ({
				label: formatBucketLabel(b.periodStart, granularity),
				value: Number(b.net),
			}));
			return { points, total: points.reduce((sum, p) => sum + p.value, 0) };
		},
	});
}

/** Collections vs refunds for a period, from the report summary. */
function useCollectionsVsRefunds(period: ReceivedTrendPeriod) {
	const axiosAuth = useAxiosAuth();

	return useQuery({
		queryKey: ["merchant", "report", "summary", period],
		queryFn: async () => {
			const { data } = await axiosAuth.get<ApiSuccessResponse<MerchantReportData>>(
				apiRoutes.merchant.REPORT_SUMMARY,
				{ params: { from: periodFrom(period) } },
			);
			return [
				{ label: "Collections", value: Number(data.data.paymentsReceived.amount) },
				{ label: "Refunds", value: Number(data.data.refundsCompleted.amount) },
			] satisfies SeriesPoint[];
		},
	});
}

export {
	useDashboardStats,
	useAllTimePaymentMethods,
	usePaymentMethodSeries,
	useRefundSeries,
	useNetSeries,
	useCollectionsVsRefunds,
};
