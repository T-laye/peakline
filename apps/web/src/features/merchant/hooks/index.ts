import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAxiosAuth } from "@/hooks/useAxiosAuth";
import { apiRoutes } from "@/lib/config/apiRoutes";
import { useAuthStore } from "@/lib/stores/authStore";
import { useMyBusiness } from "@/features/business/hooks";
import { useProfile } from "@/features/profile/hooks";
import type {
	ApiSuccessResponse,
	MerchantDashboardStatsData,
	PaginationMeta,
	PaymentLinkData,
	PaymentLinkStatsData,
	PaymentLinkStatus,
} from "@/lib/api/types";
import type { CreatePaymentLinkValues } from "@/lib/validations/paymentLinksValidations";

export type ReceivedTrendPeriod = "week" | "month" | "year";

/** "previous_month" -> "vs previous month" — `changeVsLabel` isn't a fixed
 * enum the docs pin down, so this humanizes whatever snake_case string
 * comes back instead of hardcoding "this month" for every stat (the fake
 * version said that for both Total Received *and* Today's Payments, even
 * though the latter really compares against yesterday). */
function humanizeChangeLabel(label: string) {
	return `vs ${label.replace(/_/g, " ")}`;
}

/** Both Overview's three stat cards and its Total Received chart come from
 * this one real endpoint (`GET /merchant/dashboard/stats`) — `period` only
 * changes the `chart` field, so `useMerchantOverview` calls it with a fixed
 * period (the other three fields don't vary by period) while
 * `useReceivedTrend` passes through whatever the chart's own selector
 * chose. Same query key when both happen to want "month" lets React Query
 * dedupe the two into one request.
 *
 * `staleTime: 0` + a 30s `refetchInterval` — reported live: these figures
 * kept showing stale numbers after money actually arrived. The app's own
 * `ReactQueryProvider` default (`staleTime: 60_000`, no polling) is fine
 * for most data, but wrong here specifically: nothing about this money
 * arriving happens *through* this app (a customer paying with their own
 * wallet, an external Stellar send, etc.), so there's no mutation of ours
 * to invalidate this cache on success — the only way these numbers ever
 * catch up is by asking again, whether or not the merchant happens to
 * leave and come back to this page. Same 30s cadence `useNotifications`
 * already polls at. */
function useMerchantDashboardStats(period: ReceivedTrendPeriod) {
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

interface MerchantOverviewData {
	totalReceived: number;
	totalReceivedChangePct: number | null;
	totalReceivedChangeLabel: string;
	totalSent: number;
	totalSentChangePct: number | null;
	totalSentChangeLabel: string;
	todaysPayments: number;
	todaysPaymentsChangePct: number | null;
	todaysPaymentsChangeLabel: string;
	todaySent: number;
	todaySentChangePct: number | null;
	todaySentChangeLabel: string;
	pending: number;
	pendingCount: number;
	currency: string;
}

/** Merchant Overview's headline stats — a merchant-specific query, distinct
 * from the individual dashboard's `useWalletBalance` (a single spendable
 * balance means nothing to a merchant's own "how's business going" view).
 * Real as of `GET /merchant/dashboard/stats`. `totalSent`/`todaySent` are
 * real as of 2026-09-13 — a merchant pays out too (refunds, supplier
 * payments, etc.), not just receives, so Overview now shows both
 * directions instead of only inflow. */
function useMerchantOverview() {
	const { data, ...rest } = useMerchantDashboardStats("month");

	const overview: MerchantOverviewData | undefined = data && {
		totalReceived: Number(data.totalReceived.amount),
		totalReceivedChangePct: data.totalReceived.changePct,
		totalReceivedChangeLabel: humanizeChangeLabel(data.totalReceived.changeVsLabel),
		totalSent: Number(data.totalSent.amount),
		totalSentChangePct: data.totalSent.changePct,
		totalSentChangeLabel: humanizeChangeLabel(data.totalSent.changeVsLabel),
		todaysPayments: Number(data.todaysPayments.amount),
		todaysPaymentsChangePct: data.todaysPayments.changePct,
		todaysPaymentsChangeLabel: humanizeChangeLabel(data.todaysPayments.changeVsLabel),
		todaySent: Number(data.todaySent.amount),
		todaySentChangePct: data.todaySent.changePct,
		todaySentChangeLabel: humanizeChangeLabel(data.todaySent.changeVsLabel),
		pending: Number(data.pending.amount),
		pendingCount: data.pending.count,
		currency: data.totalReceived.currency,
	};

	return { ...rest, data: overview };
}

interface ReceivedTrendPoint {
	label: string;
	inflow: number;
	outflow: number;
}

interface ReceivedTrendData {
	totalInflow: number;
	totalOutflow: number;
	currency: string;
	selectedLabel: string;
	points: ReceivedTrendPoint[];
}

/** The cash-flow chart under Overview's stat cards. Real as of the same
 * `GET /merchant/dashboard/stats` `useMerchantOverview` uses, just reading
 * `chart` instead — there's no "selected" bucket in the real response (the
 * mock's own highlighted "Apr" pill was never more than decorative), so
 * this highlights the most recent bucket instead, the closest real
 * equivalent to "the current period". Each bucket carries both `inflow`
 * (received) and `outflow` (sent) as of 2026-09-13 — previously a single
 * received-only `value`. */
function useReceivedTrend(period: ReceivedTrendPeriod) {
	const { data, ...rest } = useMerchantDashboardStats(period);

	const trend: ReceivedTrendData | undefined = data && {
		totalInflow: Number(data.chart.totalInflow),
		totalOutflow: Number(data.chart.totalOutflow),
		currency: data.chart.currency,
		selectedLabel: data.chart.buckets.at(-1)?.label ?? "",
		points: data.chart.buckets.map((bucket) => ({
			label: bucket.label,
			inflow: Number(bucket.inflow),
			outflow: Number(bucket.outflow),
		})),
	};

	return { ...rest, data: trend };
}

/** The identity to show for this account — the real business name
 * (`GET /businesses`) once merchant, the real account holder's own name
 * (`GET /users/me`) for an individual. Both self-fetched (each is cheap and
 * already cached by whichever card/page also needs it) rather than passed
 * in by the caller — no page ever actually had a real name to pass, which
 * is why this used to silently fall back to a fixed fake one everywhere.
 * Shared by `Topbar` and `GreetingHeader`'s mobile avatar so the two can't
 * drift apart. Empty string while still loading — every caller already
 * renders fine with a momentarily-blank name/initial rather than a wrong
 * one. */
function useAccountDisplayName() {
	const isMerchant = useAuthStore((state) => state.customerType === "merchant");
	const { data: profile } = useProfile({ enabled: !isMerchant });
	const { data: business } = useMyBusiness({ enabled: isMerchant });

	if (isMerchant) return business?.name ?? "";
	if (!profile) return "";
	return [profile.firstName, profile.lastName].filter(Boolean).join(" ");
}

const PAYMENT_LINKS_KEY = ["merchant", "payment-links"];

export interface PaymentLinksQuery {
	q?: string;
	status?: PaymentLinkStatus;
	from?: string;
	to?: string;
}

/**
 * Payment Links — real `/payment-links` endpoints, replacing the earlier
 * fake single-cached-array version. Server-side filtered/paginated
 * (`q`/`status`/`from`/`to`/`page`/`limit`) rather than fetched-once and
 * sliced client-side, so every filter/page change re-fetches.
 */
function useMerchantPaymentLinks(query: PaymentLinksQuery, page: number, limit: number) {
	const axiosAuth = useAxiosAuth();

	return useQuery({
		queryKey: [...PAYMENT_LINKS_KEY, query, page, limit],
		queryFn: async () => {
			const { data } = await axiosAuth.get<
				ApiSuccessResponse<PaymentLinkData[]> & { meta: PaginationMeta }
			>(apiRoutes.paymentLinks.BASE, { params: { ...query, page, limit } });
			return { links: data.data, meta: data.meta };
		},
	});
}

/** No dedicated cache entry shared with the list above — the list is now
 * properly server-paginated, so a link viewed on the detail page isn't
 * guaranteed to be in whatever page the list last fetched. */
function useMerchantPaymentLink(id: string) {
	const axiosAuth = useAxiosAuth();

	return useQuery({
		queryKey: [...PAYMENT_LINKS_KEY, id],
		queryFn: async () => {
			const { data } = await axiosAuth.get<ApiSuccessResponse<PaymentLinkData>>(
				apiRoutes.paymentLinks.byId(id),
			);
			return data.data;
		},
		enabled: !!id,
	});
}

function usePaymentLinksStats() {
	const axiosAuth = useAxiosAuth();

	return useQuery({
		queryKey: [...PAYMENT_LINKS_KEY, "stats"],
		queryFn: async () => {
			const { data } = await axiosAuth.get<ApiSuccessResponse<PaymentLinkStatsData>>(
				apiRoutes.paymentLinks.STATS,
			);
			return data.data;
		},
	});
}

function useCreatePaymentLink() {
	const axiosAuth = useAxiosAuth();
	const queryClient = useQueryClient();
	const { data: business } = useMyBusiness();

	return useMutation({
		mutationFn: async (values: CreatePaymentLinkValues) => {
			if (!business) {
				throw new Error("Add a business before creating a payment link.");
			}
			// `expiration` is a date-only value off a `type="date"` input —
			// widen to the end of that day (UTC) so the link stays usable
			// through the whole day it's shown as expiring on, rather than
			// expiring at midnight.
			const expiresAt = new Date(`${values.expiration}T23:59:59.999Z`).toISOString();
			const { data } = await axiosAuth.post<ApiSuccessResponse<PaymentLinkData>>(
				apiRoutes.paymentLinks.BASE,
				{
					title: values.title,
					amount: values.amount,
					currency: "USDC",
					businessId: business.id,
					expiresAt,
					description: values.description || undefined,
					customerReference: values.reference || undefined,
				},
			);
			return data.data;
		},
		onSuccess: () => queryClient.invalidateQueries({ queryKey: PAYMENT_LINKS_KEY }),
	});
}

function useCancelPaymentLink() {
	const axiosAuth = useAxiosAuth();
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (id: string) => {
			const { data } = await axiosAuth.post<ApiSuccessResponse<PaymentLinkData>>(
				apiRoutes.paymentLinks.byIdCancel(id),
			);
			return data.data;
		},
		onSuccess: (link) => {
			queryClient.setQueryData([...PAYMENT_LINKS_KEY, link.id], link);
			queryClient.invalidateQueries({ queryKey: PAYMENT_LINKS_KEY });
		},
	});
}

/** Blob download, same reasoning as the QR-code PNG download — a plain
 * `<a href>` wouldn't carry the `Authorization` header the proxy's
 * interceptor attaches. Runs the same filters as the list/stats views. */
function useExportPaymentLinksCsv() {
	const axiosAuth = useAxiosAuth();

	return useMutation({
		mutationFn: async (query: PaymentLinksQuery) => {
			const response = await axiosAuth.get<Blob>(apiRoutes.paymentLinks.EXPORT_CSV, {
				params: query,
				responseType: "blob",
			});
			const url = URL.createObjectURL(response.data);
			const anchor = document.createElement("a");
			anchor.href = url;
			anchor.download = `payment-links-${new Date().toISOString().slice(0, 10)}.csv`;
			anchor.click();
			URL.revokeObjectURL(url);
		},
	});
}

export {
	useMerchantOverview,
	useAccountDisplayName,
	useMerchantPaymentLinks,
	useMerchantPaymentLink,
	usePaymentLinksStats,
	useCreatePaymentLink,
	useCancelPaymentLink,
	useExportPaymentLinksCsv,
	useReceivedTrend,
};
export type { MerchantOverviewData, ReceivedTrendPoint, PaymentLinkStatus };
