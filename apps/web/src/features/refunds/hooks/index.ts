import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAxiosAuth } from "@/hooks/useAxiosAuth";
import { apiRoutes } from "@/lib/config/apiRoutes";
import { useMerchantPaymentLink, useReconciliationRecord } from "@/features/merchant/hooks";
import type {
	ApiSuccessResponse,
	CreateRefundPayload,
	EligiblePaymentData,
	MerchantDashboardStatsData,
	PaginationMeta,
	RefundableBalanceData,
	RefundData,
	RefundStatus,
} from "@/lib/api/types";

/*
 * Refunds (v3 API, frontend-integration.md §4). Flow:
 *   POST /refunds (requested, amount reserved)
 *   → POST /refunds/:id/authorize { pin } (processing → completed | failed)
 *   → poll GET /refunds/:id until it settles.
 * The server enforces the refund rules (remaining balance incl. in-flight
 * refunds, idempotency key, original payer address); the UI mirrors them.
 */

const REFUNDS_KEY = ["merchant", "refunds"];
export const IN_FLIGHT_REFUND_STATUSES: RefundStatus[] = ["requested", "authorized", "processing"];

type Paginated<T> = ApiSuccessResponse<T[]> & { meta: PaginationMeta };

function useEligiblePayments(page: number, limit: number) {
	const axiosAuth = useAxiosAuth();

	return useQuery({
		queryKey: [...REFUNDS_KEY, "eligible", page, limit],
		queryFn: async () => {
			const { data } = await axiosAuth.get<Paginated<EligiblePaymentData>>(apiRoutes.refunds.ELIGIBLE_PAYMENTS, {
				params: { page, limit },
			});
			return { payments: data.data, meta: data.meta };
		},
	});
}

export interface RefundsQuery {
	status?: RefundStatus;
	originalTransactionId?: string;
	from?: string;
	to?: string;
}

function toApiDate(date: string | undefined, endOfRange = false) {
	if (!date) return undefined;
	const d = new Date(`${date}T00:00:00Z`);
	if (endOfRange) d.setUTCDate(d.getUTCDate() + 1);
	return d.toISOString();
}

function useRefunds(query: RefundsQuery, page: number, limit: number) {
	const axiosAuth = useAxiosAuth();

	return useQuery({
		queryKey: [...REFUNDS_KEY, "list", query, page, limit],
		queryFn: async () => {
			const { data } = await axiosAuth.get<Paginated<RefundData>>(apiRoutes.refunds.BASE, {
				params: {
					status: query.status,
					originalTransactionId: query.originalTransactionId,
					from: toApiDate(query.from),
					to: toApiDate(query.to, true),
					page,
					limit,
				},
			});
			return { refunds: data.data, meta: data.meta };
		},
	});
}

/** Refund detail (includes `refundable`). Polls every 3s while in flight so
 * the details page and dialog settle without a manual refresh. */
function useRefund(id: string | null | undefined) {
	const axiosAuth = useAxiosAuth();

	return useQuery({
		queryKey: [...REFUNDS_KEY, "detail", id],
		queryFn: async () => {
			const { data } = await axiosAuth.get<ApiSuccessResponse<RefundData>>(apiRoutes.refunds.byId(id!));
			return data.data;
		},
		enabled: !!id,
		retry: false,
		refetchInterval: (query) => (query.state.data?.status === "processing" ? 3000 : false),
	});
}

/** Header cards: total refunded value + pending count come from dashboard
 * stats; total/completed/failed counts from `GET /refunds` totals. */
function useRefundStats() {
	const axiosAuth = useAxiosAuth();

	return useQuery({
		queryKey: [...REFUNDS_KEY, "stats"],
		queryFn: async () => {
			const count = async (status?: RefundStatus) => {
				const { data } = await axiosAuth.get<Paginated<RefundData>>(apiRoutes.refunds.BASE, {
					params: { status, page: 1, limit: 1 },
				});
				return data.meta.totalCount;
			};
			const [total, completed, failed, stats] = await Promise.all([
				count(),
				count("completed"),
				count("failed"),
				axiosAuth
					.get<ApiSuccessResponse<MerchantDashboardStatsData>>(apiRoutes.merchant.DASHBOARD_STATS, {
						params: { period: "month" },
					})
					.then((r) => r.data.data),
			]);
			return {
				totalRefundedAmount: stats.refundsCompleted.amount,
				total,
				completed,
				pending: stats.pendingRefunds.count,
				failed,
			};
		},
	});
}

/** 7-decimal amounts → integer units, so sums don't drift. */
const UNITS = 10_000_000;
const toUnits = (amount: string) => Math.round(Number(amount) * UNITS);
const fromUnits = (units: number) => (units / UNITS).toFixed(7);

/**
 * Everything the Initiate Refund page shows about one payment:
 * - the reconciliation record (customer, references, hash, payer address);
 * - the payment request it settled, if any (title, expected amount, phone);
 * - its refunds, and the refundable balance derived from them the same way
 *   the API does (completed = refunded, in-flight = reserved).
 */
function useRefundablePayment(transactionId: string) {
	const record = useReconciliationRecord(transactionId);
	const request = useMerchantPaymentLink(record.data?.paymentRequestId ?? "");
	const refunds = useRefunds({ originalTransactionId: transactionId }, 1, 100);

	let refundable: RefundableBalanceData | undefined;
	if (record.data && refunds.data) {
		const paid = toUnits(record.data.amount);
		const sum = (statuses: RefundStatus[]) =>
			refunds.data.refunds.filter((r) => statuses.includes(r.status)).reduce((s, r) => s + toUnits(r.amount), 0);
		const refunded = sum(["completed"]);
		const pending = sum(IN_FLIGHT_REFUND_STATUSES);
		refundable = {
			paymentAmount: record.data.amount,
			refunded: fromUnits(refunded),
			pending: fromUnits(pending),
			remaining: fromUnits(Math.max(0, paid - refunded - pending)),
		};
	}

	return {
		record: record.data,
		request: request.data,
		refunds: refunds.data?.refunds,
		refundable,
		isLoading: record.isLoading || refunds.isLoading,
		isError: record.isError,
		error: record.error,
	};
}

function useInvalidateRefunds() {
	const queryClient = useQueryClient();
	return () => {
		queryClient.invalidateQueries({ queryKey: REFUNDS_KEY });
		queryClient.invalidateQueries({ queryKey: ["merchant", "reconciliation"] });
		queryClient.invalidateQueries({ queryKey: ["merchant", "dashboard-stats"] });
		queryClient.invalidateQueries({ queryKey: ["merchant", "report"] });
		queryClient.invalidateQueries({ queryKey: ["dashboard", "balance"] });
	};
}

/** Step 1 — reserves the amount. Same idempotency key + same payment +
 * same amount returns the same refund, so retries never create a second. */
function useCreateRefund() {
	const axiosAuth = useAxiosAuth();
	const invalidate = useInvalidateRefunds();

	return useMutation({
		mutationFn: async (payload: CreateRefundPayload) => {
			const { data } = await axiosAuth.post<ApiSuccessResponse<RefundData>>(apiRoutes.refunds.BASE, payload);
			return data.data;
		},
		onSuccess: invalidate,
	});
}

/** Step 2 — PIN, then the Stellar payment is submitted. 401 INVALID_PIN,
 * 403 PIN_LOCKED / PIN_NOT_SET, 422 with `details.issues` (stays
 * requested), 422 insufficient balance (becomes authorized → execute). */
function useAuthorizeRefund() {
	const axiosAuth = useAxiosAuth();
	const invalidate = useInvalidateRefunds();

	return useMutation({
		mutationFn: async ({ id, pin }: { id: string; pin: string }) => {
			const { data } = await axiosAuth.post<ApiSuccessResponse<RefundData>>(apiRoutes.refunds.authorize(id), { pin });
			return data.data;
		},
		onSettled: invalidate,
	});
}

/** Retry an `authorized` refund that couldn't start (no PIN needed). */
function useExecuteRefund() {
	const axiosAuth = useAxiosAuth();
	const invalidate = useInvalidateRefunds();

	return useMutation({
		mutationFn: async (id: string) => {
			const { data } = await axiosAuth.post<ApiSuccessResponse<RefundData>>(apiRoutes.refunds.execute(id));
			return data.data;
		},
		onSettled: invalidate,
	});
}

/** Only while requested/authorized; releases the reserved amount. */
function useCancelRefund() {
	const axiosAuth = useAxiosAuth();
	const invalidate = useInvalidateRefunds();

	return useMutation({
		mutationFn: async (id: string) => {
			const { data } = await axiosAuth.post<ApiSuccessResponse<RefundData>>(apiRoutes.refunds.cancel(id));
			return data.data;
		},
		onSettled: invalidate,
	});
}

/** Refund records as CSV, via the reconciliation export (`type=refund`) —
 * there's no refunds-specific export. */
function useExportRefundsCsv() {
	const axiosAuth = useAxiosAuth();

	return useMutation({
		mutationFn: async (query: { from?: string; to?: string }) => {
			const response = await axiosAuth.get<Blob>(apiRoutes.merchant.RECONCILIATION_EXPORT_CSV, {
				params: { type: "refund", from: toApiDate(query.from), to: toApiDate(query.to, true) },
				responseType: "blob",
			});
			const url = URL.createObjectURL(response.data);
			const anchor = document.createElement("a");
			anchor.href = url;
			anchor.download = `refunds-${new Date().toISOString().slice(0, 10)}.csv`;
			anchor.click();
			URL.revokeObjectURL(url);
		},
	});
}

export {
	useEligiblePayments,
	useRefunds,
	useRefund,
	useRefundStats,
	useRefundablePayment,
	useCreateRefund,
	useAuthorizeRefund,
	useExecuteRefund,
	useCancelRefund,
	useExportRefundsCsv,
};
