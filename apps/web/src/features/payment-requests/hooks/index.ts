import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
	PaginationMeta,
	PaymentRequestCustomer,
	PaymentRequestData,
	PaymentRequestStatsData,
	PaymentRequestStatus,
} from "@/lib/api/types";
import type { CreatePaymentRequestValues } from "@/lib/validations/paymentRequestsValidations";
import { MOCK_CUSTOMERS, mockPaymentRequests } from "./mockData";

/*
 * Payment Requests (third tranche) — **mock-backed**. There's no backend for
 * this yet, so every hook below reads/writes the in-memory `mockPaymentRequests`
 * array behind a short fake delay. Each hook is shaped like its real
 * counterpart will be (same query params, `{ requests, meta }` envelope as
 * payment links), so swapping to the API is a `queryFn`/`mutationFn` change
 * only — mirror `useMerchantPaymentLinks` & co. in `features/merchant/hooks`.
 * Filtering/pagination happens here client-side purely because the mock has
 * no server to do it.
 */

const PAYMENT_REQUESTS_KEY = ["merchant", "payment-requests"];

function fakeDelay(ms = 400) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

export interface PaymentRequestsQuery {
	q?: string;
	status?: PaymentRequestStatus;
	from?: string;
	to?: string;
}

function matchesQuery(request: PaymentRequestData, query: PaymentRequestsQuery) {
	if (query.status && request.status !== query.status) return false;
	const created = request.createdAt.slice(0, 10);
	if (query.from && created < query.from) return false;
	if (query.to && created > query.to) return false;
	if (query.q) {
		const needle = query.q.toLowerCase();
		const haystack = [
			request.reference,
			request.title,
			request.customer.name,
			request.customerReference,
		]
			.filter(Boolean)
			.join(" ")
			.toLowerCase();
		if (!haystack.includes(needle)) return false;
	}
	return true;
}

function filterRequests(query: PaymentRequestsQuery) {
	return mockPaymentRequests
		.filter((request) => matchesQuery(request, query))
		.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

function usePaymentRequests(query: PaymentRequestsQuery, page: number, limit: number) {
	return useQuery({
		queryKey: [...PAYMENT_REQUESTS_KEY, query, page, limit],
		queryFn: async () => {
			await fakeDelay();
			const all = filterRequests(query);
			const pageCount = Math.max(1, Math.ceil(all.length / limit));
			const meta: PaginationMeta = {
				totalCount: all.length,
				pageCount,
				currentPage: page,
				limit,
				prevPage: page > 1,
				nextPage: page < pageCount,
			};
			return { requests: all.slice((page - 1) * limit, page * limit), meta };
		},
	});
}

function usePaymentRequest(id: string) {
	return useQuery({
		queryKey: [...PAYMENT_REQUESTS_KEY, "detail", id],
		queryFn: async () => {
			await fakeDelay();
			const request = mockPaymentRequests.find((r) => r.id === id);
			if (!request) throw new Error("Payment request not found.");
			return request;
		},
		enabled: !!id,
		retry: false,
	});
}

function usePaymentRequestStats() {
	return useQuery({
		queryKey: [...PAYMENT_REQUESTS_KEY, "stats"],
		queryFn: async (): Promise<PaymentRequestStatsData> => {
			await fakeDelay();
			const count = (status: PaymentRequestStatus) =>
				mockPaymentRequests.filter((r) => r.status === status).length;
			const outstanding = mockPaymentRequests
				.filter((r) => r.status === "pending" || r.status === "processing")
				.reduce((sum, r) => sum + Number(r.amount), 0);
			return {
				total: mockPaymentRequests.length,
				pending: count("pending"),
				paid: count("paid"),
				expired: count("expired"),
				outstandingAmount: outstanding.toFixed(2),
			};
		},
	});
}

/** Customers the merchant has requested from before — feeds the create
 * form's "Customer selection" dropdown. Will become a real customers
 * endpoint (the Customers page is still a placeholder). */
function usePaymentRequestCustomers() {
	return useQuery({
		queryKey: [...PAYMENT_REQUESTS_KEY, "customers"],
		queryFn: async (): Promise<PaymentRequestCustomer[]> => {
			await fakeDelay(200);
			return MOCK_CUSTOMERS;
		},
	});
}

function useCreatePaymentRequest() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (values: CreatePaymentRequestValues) => {
			await fakeDelay(700);
			const existing = MOCK_CUSTOMERS.find((c) => c.id === values.customerId);
			const customer: PaymentRequestCustomer = existing ?? {
				id: `cus_${Date.now()}`,
				name: values.customerName,
				email: values.customerEmail || null,
			};
			if (!existing) MOCK_CUSTOMERS.push(customer);

			const next =
				Math.max(...mockPaymentRequests.map((r) => Number(r.reference.split("-")[1]))) + 1;
			const reference = `REQ-${next}`;
			const now = new Date().toISOString();
			const request: PaymentRequestData = {
				id: `req_${Date.now()}`,
				reference,
				title: null,
				customer,
				amount: values.amount.toFixed(2),
				currency: "USDC",
				description: values.description || null,
				customerReference: values.reference || null,
				// End of the chosen day (UTC), same as payment links' expiry.
				dueAt: values.dueDate ? new Date(`${values.dueDate}T23:59:59.999Z`).toISOString() : null,
				status: "pending",
				url: `${window.location.origin}/request/${reference.toLowerCase()}`,
				transactionId: null,
				createdAt: now,
				updatedAt: now,
			};
			mockPaymentRequests.push(request);
			return request;
		},
		onSuccess: () => queryClient.invalidateQueries({ queryKey: PAYMENT_REQUESTS_KEY }),
	});
}

/** Only unpaid requests can be cancelled — per the brief, cancelling can't
 * reverse a payment already submitted on-chain. */
function useCancelPaymentRequest() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (id: string) => {
			await fakeDelay(500);
			const request = mockPaymentRequests.find((r) => r.id === id);
			if (!request) throw new Error("Payment request not found.");
			if (request.status !== "pending") {
				throw new Error("Only unpaid, pending requests can be cancelled.");
			}
			request.status = "cancelled";
			request.updatedAt = new Date().toISOString();
			return { ...request };
		},
		onSuccess: () => queryClient.invalidateQueries({ queryKey: PAYMENT_REQUESTS_KEY }),
	});
}

function csvCell(value: string | null | undefined) {
	const text = value ?? "";
	return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

/** Built client-side from the mock; the real one will be a blob download
 * from an `export.csv` endpoint, like `useExportPaymentLinksCsv`. */
function useExportPaymentRequestsCsv() {
	return useMutation({
		mutationFn: async (query: PaymentRequestsQuery) => {
			await fakeDelay(300);
			const header = [
				"Request ID",
				"Customer",
				"Customer Email",
				"Amount",
				"Asset",
				"Due Date",
				"Date Created",
				"Payment Reference",
				"Status",
			];
			const rows = filterRequests(query).map((r) => [
				r.reference,
				r.customer.name,
				r.customer.email,
				r.amount,
				r.currency,
				r.dueAt?.slice(0, 10),
				r.createdAt.slice(0, 10),
				r.customerReference,
				r.status,
			]);
			const csv = [header, ...rows].map((row) => row.map(csvCell).join(",")).join("\n");
			const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
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
	usePaymentRequestStats,
	usePaymentRequestCustomers,
	useCreatePaymentRequest,
	useCancelPaymentRequest,
	useExportPaymentRequestsCsv,
};
