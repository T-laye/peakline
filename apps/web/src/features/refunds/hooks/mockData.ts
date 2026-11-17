import type { PaymentMethodKind, RefundData, RefundStatus, ReconciliationStatus } from "@/lib/api/types";

/** Temporary in-memory data for Refund Management until the backend exists.
 * Mutated in place by the mock refund hook (resets on full reload). Delete
 * once `features/refunds/hooks` hits the real API. */

export interface MockPayment {
	id: string;
	reference: string;
	title: string;
	customer: { name: string; phone?: string | null };
	method: PaymentMethodKind;
	requestReference: string | null;
	customerReference: string | null;
	expectedAmount: string;
	amount: string;
	reconciliationStatus: ReconciliationStatus;
	stellarTxHash: string;
	customerWallet: string;
	paidAt: string;
}

function daysAgo(days: number, hour = 10) {
	const d = new Date(Date.now() - days * 86_400_000);
	d.setHours(hour, 40, 0, 0);
	return d.toISOString();
}

/** Deterministic pseudo-random string (mulberry32) for fake hashes/wallets. */
function pseudoRandom(seed: number, length: number, chars: string) {
	let a = seed >>> 0;
	let out = "";
	for (let i = 0; i < length; i++) {
		a = (a + 0x6d2b79f5) >>> 0;
		let t = Math.imul(a ^ (a >>> 15), 1 | a);
		t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
		out += chars[((t ^ (t >>> 14)) >>> 0) % chars.length];
	}
	return out;
}

function fakeHash(seed: number) {
	return pseudoRandom(seed, 64, "abcdef0123456789");
}

function fakeWallet(seed: number) {
	return `G${pseudoRandom(seed * 31, 55, "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567")}`;
}

export { fakeHash };

const PAYMENT_SEED: Omit<MockPayment, "id" | "reference" | "stellarTxHash" | "customerWallet">[] = [
	{ title: "Custom Bag Order", customer: { name: "John Doe", phone: "+233 958 3476 4972" }, method: "payment_request", requestReference: "REQ-1168", customerReference: "Order #1234", expectedAmount: "500.00", amount: "500.00", reconciliationStatus: "matched", paidAt: daysAgo(2) },
	{ title: "Wedding shoot balance", customer: { name: "Mary Doe", phone: "+233 244 118 902" }, method: "payment_request", requestReference: "REQ-1003", customerReference: "INV-1038", expectedAmount: "200.00", amount: "200.00", reconciliationStatus: "matched", paidAt: daysAgo(4) },
	{ title: "Event tickets", customer: { name: "Ama Mensah", phone: "+233 201 445 778" }, method: "payment_link", requestReference: null, customerReference: "PAY-1001", expectedAmount: "350.00", amount: "350.00", reconciliationStatus: "matched", paidAt: daysAgo(6) },
	{ title: "Store purchase", customer: { name: "Kofi Boateng", phone: null }, method: "qr", requestReference: null, customerReference: null, expectedAmount: "120.00", amount: "120.00", reconciliationStatus: "unmatched", paidAt: daysAgo(7) },
	{ title: "Logo design", customer: { name: "Mary Doe", phone: "+233 244 118 902" }, method: "payment_request", requestReference: "REQ-1006", customerReference: "INV-1031", expectedAmount: "350.00", amount: "350.00", reconciliationStatus: "matched", paidAt: daysAgo(9) },
	{ title: "Monthly supplies", customer: { name: "Ama Mensah", phone: "+233 201 445 778" }, method: "payment_request", requestReference: "REQ-1011", customerReference: "INV-1020", expectedAmount: "640.00", amount: "640.00", reconciliationStatus: "matched", paidAt: daysAgo(12) },
	{ title: "Catering deposit", customer: { name: "John Doe", phone: "+233 958 3476 4972" }, method: "payment_link", requestReference: null, customerReference: "INV-1009", expectedAmount: "1000.00", amount: "1000.00", reconciliationStatus: "matched", paidAt: daysAgo(15) },
	{ title: "Wholesale order", customer: { name: "Kofi Boateng", phone: null }, method: "payment_request", requestReference: "REQ-1008", customerReference: "PO-71", expectedAmount: "800.00", amount: "750.00", reconciliationStatus: "amount_mismatch", paidAt: daysAgo(18) },
	{ title: "Tailoring", customer: { name: "Esi Owusu", phone: "+233 277 900 312" }, method: "qr", requestReference: null, customerReference: null, expectedAmount: "180.00", amount: "180.00", reconciliationStatus: "unmatched", paidAt: daysAgo(21) },
	{ title: "Consulting — phase 1", customer: { name: "John Doe", phone: "+233 958 3476 4972" }, method: "payment_request", requestReference: "REQ-0990", customerReference: "INV-0990", expectedAmount: "2000.00", amount: "2000.00", reconciliationStatus: "matched", paidAt: daysAgo(26) },
	{ title: "Fabric samples", customer: { name: "Esi Owusu", phone: "+233 277 900 312" }, method: "payment_link", requestReference: null, customerReference: "PAY-0977", expectedAmount: "90.00", amount: "90.00", reconciliationStatus: "matched", paidAt: daysAgo(30) },
];

export const mockPayments: MockPayment[] = PAYMENT_SEED.map((seed, i) => ({
	...seed,
	id: `pay_${101 + i}`,
	reference: `TRANS-${10 + i}-${["JYPHI01", "KQZ7A02", "MXR4B03", "PLW9C04", "QNE2D05", "RTY6E06", "SVB1F07", "TUC8G08", "UWD3H09", "VXE5J10", "WYF7K11"][i]}`,
	stellarTxHash: fakeHash(101 + i),
	customerWallet: fakeWallet(101 + i),
}));

const REFUND_SEED: {
	payment: number;
	type: "full" | "partial";
	amount: string;
	reason: string;
	status: RefundStatus;
	daysAgo: number;
	failureReason?: string;
}[] = [
	{ payment: 1, type: "full", amount: "200.00", reason: "Session cancelled by photographer", status: "completed", daysAgo: 3 },
	{ payment: 2, type: "partial", amount: "100.00", reason: "One ticket unused", status: "completed", daysAgo: 5 },
	{ payment: 4, type: "partial", amount: "50.00", reason: "Revision not delivered", status: "processing", daysAgo: 0 },
	{ payment: 5, type: "partial", amount: "140.00", reason: "Damaged items", status: "failed", daysAgo: 10, failureReason: "Destination account has no USDC trustline." },
	{ payment: 6, type: "partial", amount: "250.00", reason: "Reduced headcount", status: "completed", daysAgo: 13 },
	{ payment: 6, type: "partial", amount: "100.00", reason: "Menu change", status: "completed", daysAgo: 11 },
	{ payment: 9, type: "partial", amount: "300.00", reason: "Scope reduced", status: "requested", daysAgo: 0 },
	{ payment: 10, type: "full", amount: "90.00", reason: "I'm out of stock suddenly", status: "completed", daysAgo: 28 },
];

export const mockRefunds: RefundData[] = REFUND_SEED.map((seed, i) => {
	const payment = mockPayments[seed.payment]!;
	const createdAt = daysAgo(seed.daysAgo, 14);
	return {
		id: `rf_${201 + i}`,
		paymentId: payment.id,
		type: seed.type,
		amount: seed.amount,
		currency: "USDC",
		reason: seed.reason,
		status: seed.status,
		destinationWallet: payment.customerWallet,
		stellarTxHash: seed.status === "completed" ? fakeHash(201 + i) : null,
		failureReason: seed.failureReason ?? null,
		createdAt,
		completedAt: seed.status === "completed" ? createdAt : null,
	};
});
