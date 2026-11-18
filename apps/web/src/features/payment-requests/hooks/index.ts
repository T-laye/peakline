import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAxiosAuth } from "@/hooks/useAxiosAuth";
import { apiRoutes } from "@/lib/config/apiRoutes";
import { useMyBusiness } from "@/features/business/hooks";
import type {
	ApiSuccessResponse,
	CollectionsOverviewData,
	CustomerCollectionData,
	PaginationMeta,
	PaymentLinkData,
	PaymentLinkPaymentData,
	PaymentLinkStatus,
} from "@/lib/api/types";
import type { CreatePaymentRequestValues } from "@/lib/validations/paymentRequestsValidations";

/*
 * Customer payment requests (v3). On the API these are payment links with
 * `kind: "request"` — created by setting customer fields, single-use, and
 * tracked through pending → processing → paid (or expired / cancelled /
 * flagged). Every call here is scoped to `kind=request` so reusable links
 * stay on the Payment Links page.
 */

// Shares the payment-links cache prefix so cancelling/creating from either
// page refreshes both.
const PAYMENT_REQUESTS_KEY = ["merchant", "payment-links", "requests"];

export interface PaymentRequestsQuery {
	q?: string;
	status?: PaymentLinkStatus;
	from?: string;
	to?: string;
}

/** Date-only filter values → the API's ISO bounds (`to` is exclusive, so
 * push it to the start of the next day to include the chosen day). */
function toApiQuery(query: PaymentRequestsQuery) {
	const nextDay = (date: string) => {
		const d = new Date(`${date}T00:00:00Z`);
		d.setUTCDate(d.getUTCDate() + 1);
		return d.toISOString();
	};
	return {
		kind: "request" as const,
		q: query.q,
		status: query.status,
		from: query.from ? new Date(`${query.from}T00:00:00Z`).toISOString() : undefined,
		to: query.to ? nextDay(query.to) : undefined,
	};
}

function usePaymentRequests(query: PaymentRequestsQuery, page: number, limit: number) {
	const axiosAuth = useAxiosAuth();

	return useQuery({
		queryKey: [...PAYMENT_REQUESTS_KEY, query, page, limit],
		queryFn: async () => {
			const { data } = await axiosAuth.get<ApiSuccessResponse<PaymentLinkData[]> & { meta: PaginationMeta }>(
				apiRoutes.paymentLinks.BASE,
				{ params: { ...toApiQuery(query), page, limit } },
			);
			return { requests: data.data, meta: data.meta };
		},
	});
}

function usePaymentRequest(id: string) {
	const axiosAuth = useAxiosAuth();

	return useQuery({
		queryKey: [...PAYMENT_REQUESTS_KEY, "detail", id],
		queryFn: async () => {
			const { data } = await axiosAuth.get<ApiSuccessResponse<PaymentLinkData>>(apiRoutes.paymentLinks.byId(id));
			return data.data;
		},
		enabled: !!id,
		retry: false,
	});
}

/** `GET /payment-links/collections` — requests only. Feeds the outstanding
 * value card and the four count cards. */
function usePaymentRequestCollections() {
	const axiosAuth = useAxiosAuth();

	return useQuery({
		queryKey: [...PAYMENT_REQUESTS_KEY, "collections"],
		queryFn: async () => {
			const { data } = await axiosAuth.get<ApiSuccessResponse<CollectionsOverviewData>>(
				apiRoutes.paymentLinks.COLLECTIONS,
			);
			return data.data;
		},
	});
}

/** On-chain payments attributed to a request — the detail page's "View
 * associated payment transaction" uses the credited one's `transactionId`. */
function usePaymentRequestPayments(id: string) {
	const axiosAuth = useAxiosAuth();

	return useQuery({
		queryKey: [...PAYMENT_REQUESTS_KEY, "payments", id],
		queryFn: async () => {
			const { data } = await axiosAuth.get<
				ApiSuccessResponse<PaymentLinkPaymentData[]> & { meta: PaginationMeta }
			>(apiRoutes.paymentLinks.byIdPayments(id), { params: { page: 1, limit: 20 } });
			return data.data;
		},
		enabled: !!id,
	});
}

/** Customers the merchant has requested from before
 * (`GET /merchant/reports/customers`) — the create form's dropdown. */
function usePaymentRequestCustomers() {
	const axiosAuth = useAxiosAuth();

	return useQuery({
		queryKey: ["merchant", "report", "customers"],
		queryFn: async () => {
			const { data } = await axiosAuth.get<
				ApiSuccessResponse<CustomerCollectionData[]> & { meta: PaginationMeta }
			>(apiRoutes.merchant.REPORT_CUSTOMERS, { params: { page: 1, limit: 100 } });
			return data.data.filter((customer) => customer.customerName || customer.customerEmail);
		},
	});
}

function useCreatePaymentRequest() {
	const axiosAuth = useAxiosAuth();
	const queryClient = useQueryClient();
	const { data: business } = useMyBusiness();

	return useMutation({
		mutationFn: async (values: CreatePaymentRequestValues) => {
			if (!business) throw new Error("Add a business before creating a payment request.");
			const { data } = await axiosAuth.post<ApiSuccessResponse<PaymentLinkData>>(apiRoutes.paymentLinks.BASE, {
				title: values.title,
				amount: String(values.amount),
				currency: "USDC",
				businessId: business.id,
				description: values.description || undefined,
				customerReference: values.reference || undefined,
				// Setting customer fields is what makes this a single-use request.
				customerName: values.customerName,
				customerEmail: values.customerEmail || undefined,
				// End of the chosen day (UTC); the API defaults to 30 days when omitted.
				expiresAt: values.dueDate ? new Date(`${values.dueDate}T23:59:59.999Z`).toISOString() : undefined,
			});
			return data.data;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["merchant", "payment-links"] });
			queryClient.invalidateQueries({ queryKey: ["merchant", "report"] });
		},
	});
}

/** Allowed while pending, flagged or expired; the API returns 409 once paid
 * or while a payment is being verified. */
function useCancelPaymentRequest() {
	const axiosAuth = useAxiosAuth();
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (id: string) => {
			const { data } = await axiosAuth.post<ApiSuccessResponse<PaymentLinkData>>(apiRoutes.paymentLinks.byIdCancel(id));
			return data.data;
		},
		onSuccess: (request) => {
			queryClient.setQueryData([...PAYMENT_REQUESTS_KEY, "detail", request.id], request);
			queryClient.invalidateQueries({ queryKey: ["merchant", "payment-links"] });
		},
	});
}

/** Blob download of `GET /payment-links/export.csv?kind=request`. */
function useExportPaymentRequestsCsv() {
	const axiosAuth = useAxiosAuth();

	return useMutation({
		mutationFn: async (query: PaymentRequestsQuery) => {
			const response = await axiosAuth.get<Blob>(apiRoutes.paymentLinks.EXPORT_CSV, {
				params: toApiQuery(query),
				responseType: "blob",
			});
			const url = URL.createObjectURL(response.data);
			const anchor = document.createElement("a");
			anchor.href = url;
			anchor.download = `payment-requests-${new Date().toISOString().slice(0, 10)}.csv`;
			anchor.click();
			URL.revokeObjectURL(url);
		},
	});
}

export {
	usePaymentRequests,
	usePaymentRequest,
	usePaymentRequestCollections,
	usePaymentRequestPayments,
	usePaymentRequestCustomers,
	useCreatePaymentRequest,
	useCancelPaymentRequest,
	useExportPaymentRequestsCsv,
};
