import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
	PaginationMeta,
	RefundablePaymentData,
	RefundData,
	RefundStatsData,
	RefundType,
} from "@/lib/api/types";
import { fakeHash, mockPayments, mockRefunds, type MockPayment } from "./mockData";

/*
 * Refund Management (third tranche) — **mock-backed** until the backend
 * exists, same approach as `features/payment-requests/hooks`. The refund
 * rules from the v3 brief are enforced here so the UI behaves correctly
 * against them now; the real API must enforce them again server-side:
 * - only verified (paid) payments are refundable;
 * - amount > 0 and ≤ remaining refundable balance, where in-flight
 *   (requested/authorized/processing) refunds are *reserved* against it;
 * - one submission per idempotency key (duplicate-submit protection);
 * - failed refunds never count as refunded.
 */

const REFUNDS_KEY = ["merchant", "refunds"];
const IN_FLIGHT = new Set(["requested", "authorized", "processing"]);

function fakeDelay(ms = 400) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

function toCents(value: string | number) {
	return Math.round(Number(value) * 100);
}

function fromCents(cents: number) {
	return (cents / 100).toFixed(2);
}

function buildPayment(payment: MockPayment): RefundablePaymentData {
	const refunds = mockRefunds
		.filter((r) => r.paymentId === payment.id)
		.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
	const refunded = refunds.filter((r) => r.status === "completed").reduce((s, r) => s + toCents(r.amount), 0);
	const pending = refunds.filter((r) => IN_FLIGHT.has(r.status)).reduce((s, r) => s + toCents(r.amount), 0);
	return {
		...payment,
		currency: "USDC",
		paymentStatus: "paid",
		refundedAmount: fromCents(refunded),
		pendingRefundAmount: fromCents(pending),
		remainingRefundable: fromCents(Math.max(0, toCents(payment.amount) - refunded - pending)),
		refunds,
	};
}

/** Refund state of a payment, for the list's status pill and filter. */
export type PaymentRefundState = "paid" | "refund_pending" | "partially_refunded" | "refunded";

export function paymentRefundState(payment: RefundablePaymentData): PaymentRefundState {
	if (Number(payment.pendingRefundAmount) > 0) return "refund_pending";
	if (Number(payment.remainingRefundable) === 0) return "refunded";
	if (Number(payment.refundedAmount) > 0) return "partially_refunded";
	return "paid";
}

export interface RefundsQuery {
	q?: string;
	state?: PaymentRefundState;
	from?: string;
	to?: string;
}

function filterPayments(query: RefundsQuery) {
	return mockPayments
		.map(buildPayment)
		.filter((p) => {
			if (query.state && paymentRefundState(p) !== query.state) return false;
			const paid = p.paidAt.slice(0, 10);
			if (query.from && paid < query.from) return false;
			if (query.to && paid > query.to) return false;
			if (query.q) {
				const needle = query.q.toLowerCase();
				const haystack = `${p.customer.name} ${p.reference} ${p.title}`.toLowerCase();
				if (!haystack.includes(needle)) return false;
			}
			return true;
		})
		.sort((a, b) => b.paidAt.localeCompare(a.paidAt));
}

function useRefundablePayments(query: RefundsQuery, page: number, limit: number) {
	return useQuery({
		queryKey: [...REFUNDS_KEY, "payments", query, page, limit],
		queryFn: async () => {
			await fakeDelay();
			const all = filterPayments(query);
			const pageCount = Math.max(1, Math.ceil(all.length / limit));
			const meta: PaginationMeta = {
				totalCount: all.length,
				pageCount,
				currentPage: page,
				limit,
				prevPage: page > 1,
				nextPage: page < pageCount,
			};
			return { payments: all.slice((page - 1) * limit, page * limit), meta };
		},
	});
}

function useRefundablePayment(id: string) {
	return useQuery({
		queryKey: [...REFUNDS_KEY, "payment", id],
		queryFn: async () => {
			await fakeDelay();
			const payment = mockPayments.find((p) => p.id === id);
			if (!payment) throw new Error("Payment not found.");
			return buildPayment(payment);
		},
		enabled: !!id,
		retry: false,
	});
}

function useRefund(refundId: string) {
	return useQuery({
		queryKey: [...REFUNDS_KEY, "refund", refundId],
		queryFn: async () => {
			await fakeDelay();
			const refund = mockRefunds.find((r) => r.id === refundId);
			if (!refund) throw new Error("Refund not found.");
			const payment = mockPayments.find((p) => p.id === refund.paymentId)!;
			return { refund: { ...refund }, payment: buildPayment(payment) };
		},
		enabled: !!refundId,
		retry: false,
	});
}

function computeRefundStats(): RefundStatsData {
	const completed = mockRefunds.filter((r) => r.status === "completed");
	return {
		totalRefundedAmount: fromCents(completed.reduce((s, r) => s + toCents(r.amount), 0)),
		total: mockRefunds.length,
		completed: completed.length,
		pending: mockRefunds.filter((r) => IN_FLIGHT.has(r.status)).length,
		failed: mockRefunds.filter((r) => r.status === "failed").length,
	};
}

function useRefundStats() {
	return useQuery({
		queryKey: [...REFUNDS_KEY, "stats"],
		queryFn: async () => {
			await fakeDelay();
			return computeRefundStats();
		},
	});
}

export interface CreateRefundInput {
	paymentId: string;
	type: RefundType;
	amount: number;
	reason: string;
	/** Transaction PIN authorizing execution. */
	pin: string;
	/** One per refund attempt (generated when the dialog opens) — a second
	 * submit with the same key is rejected instead of paying out twice. */
	idempotencyKey: string;
}

const usedIdempotencyKeys = new Map<string, string>();

/** Requested → Authorized (PIN) → Processing (Stellar submit) → Completed.
 * The mock always succeeds after a short "network" delay. */
function useCreateRefund() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (input: CreateRefundInput): Promise<RefundData> => {
			await fakeDelay(500);
			const existingId = usedIdempotencyKeys.get(input.idempotencyKey);
			if (existingId) {
				throw new Error("This refund was already submitted — check Refund Management before trying again.");
			}
			const source = mockPayments.find((p) => p.id === input.paymentId);
			if (!source) throw new Error("Payment not found.");
			const payment = buildPayment(source);
			const amount = toCents(input.amount);
			if (amount <= 0) throw new Error("Refund amount must be greater than zero.");
			if (amount > toCents(payment.remainingRefundable)) {
				throw new Error(
					`Refund exceeds the remaining refundable balance of ${payment.remainingRefundable} USDC.`,
				);
			}
			if (!/^\d{6}$/.test(input.pin)) throw new Error("Enter your 6-digit transaction PIN.");

			const now = new Date().toISOString();
			const refund: RefundData = {
				id: `rf_${Date.now()}`,
				paymentId: payment.id,
				type: input.type,
				amount: fromCents(amount),
				currency: "USDC",
				reason: input.reason,
				status: "processing",
				destinationWallet: payment.customerWallet,
				stellarTxHash: null,
				failureReason: null,
				createdAt: now,
				completedAt: null,
			};
			mockRefunds.push(refund);
			usedIdempotencyKeys.set(input.idempotencyKey, refund.id);

			await fakeDelay(1200);
			refund.status = "completed";
			refund.stellarTxHash = fakeHash(Date.now() % 100000);
			refund.completedAt = new Date().toISOString();
			return { ...refund };
		},
		onSettled: () => queryClient.invalidateQueries({ queryKey: REFUNDS_KEY }),
	});
}

function csvCell(value: string | null | undefined) {
	const text = value ?? "";
	return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function useExportRefundsCsv() {
	return useMutation({
		mutationFn: async (query: RefundsQuery) => {
			await fakeDelay(300);
			const header = [
				"Transaction reference",
				"Payment request ID",
				"Customer reference",
				"Customer",
				"Transaction type",
				"Amount",
				"Asset",
				"Payment status",
				"Refund status",
				"Refunded amount",
				"Remaining refundable",
				"Stellar transaction hash",
				"Transaction date",
				"Reconciliation status",
			];
			const rows = filterPayments(query).map((p) => [
				p.reference,
				p.requestReference,
				p.customerReference,
				p.customer.name,
				"payment",
				p.amount,
				p.currency,
				p.paymentStatus,
				paymentRefundState(p),
				p.refundedAmount,
				p.remainingRefundable,
				p.stellarTxHash,
				p.paidAt,
				p.reconciliationStatus,
			]);
			const csv = [header, ...rows].map((row) => row.map(csvCell).join(",")).join("\n");
			const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
			const anchor = document.createElement("a");
			anchor.href = url;
			anchor.download = `refunds-${new Date().toISOString().slice(0, 10)}.csv`;
			anchor.click();
			URL.revokeObjectURL(url);
		},
	});
}

export {
	useRefundablePayments,
	useRefundablePayment,
	useRefund,
	useRefundStats,
	useCreateRefund,
	useExportRefundsCsv,
	computeRefundStats,
};
