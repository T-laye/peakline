import type { PaymentRequestCustomer, PaymentRequestData, PaymentRequestStatus } from "@/lib/api/types";

/** Temporary in-memory data for the Payment Requests screens until the
 * backend exists. Mutated in place by the mock create/cancel hooks, so it
 * resets on a full page reload. Delete this file once the hooks hit the API. */

export const MOCK_CUSTOMERS: PaymentRequestCustomer[] = [
	{ id: "cus_1", name: "John Doe", email: "john.doe@example.com" },
	{ id: "cus_2", name: "Mary Doe", email: "mary.doe@example.com" },
	{ id: "cus_3", name: "Ama Mensah", email: "ama.mensah@example.com" },
	{ id: "cus_4", name: "Kofi Boateng", email: null },
];

function daysAgo(days: number) {
	return new Date(Date.now() - days * 86_400_000).toISOString();
}

function daysFromNow(days: number) {
	return new Date(Date.now() + days * 86_400_000).toISOString();
}

const SEED: {
	title: string | null;
	customer: number;
	amount: string;
	status: PaymentRequestStatus;
	createdDaysAgo: number;
	dueInDays: number | null;
	description: string | null;
	customerReference: string | null;
}[] = [
	{ title: "Custom Order", customer: 1, amount: "500.00", status: "pending", createdDaysAgo: 1, dueInDays: 2, description: "For a custom order cloth", customerReference: "Cust #224" },
	{ title: "Website retainer", customer: 0, amount: "1200.00", status: "pending", createdDaysAgo: 3, dueInDays: 11, description: "November retainer", customerReference: "INV-1042" },
	{ title: null, customer: 2, amount: "250.00", status: "paid", createdDaysAgo: 5, dueInDays: 2, description: "Catering deposit", customerReference: "INV-1038" },
	{ title: "Bulk fabric", customer: 3, amount: "3000.00", status: "processing", createdDaysAgo: 6, dueInDays: 1, description: null, customerReference: "PO-77" },
	{ title: null, customer: 0, amount: "500.00", status: "expired", createdDaysAgo: 20, dueInDays: -6, description: "Event tickets", customerReference: "PAY-1001" },
	{ title: "Logo design", customer: 1, amount: "350.00", status: "paid", createdDaysAgo: 9, dueInDays: -2, description: null, customerReference: "INV-1031" },
	{ title: null, customer: 2, amount: "120.00", status: "cancelled", createdDaysAgo: 12, dueInDays: null, description: "Duplicate request", customerReference: null },
	{ title: "Wholesale order", customer: 3, amount: "800.00", status: "flagged", createdDaysAgo: 14, dueInDays: -4, description: "Paid 750 USDC — short by 50", customerReference: "PO-71" },
	{ title: null, customer: 0, amount: "2500.00", status: "pending", createdDaysAgo: 2, dueInDays: null, description: "Consulting — phase 2", customerReference: "INV-1044" },
	{ title: "Tailoring", customer: 1, amount: "180.00", status: "expired", createdDaysAgo: 30, dueInDays: -15, description: null, customerReference: "Cust #198" },
	{ title: null, customer: 2, amount: "640.00", status: "paid", createdDaysAgo: 16, dueInDays: -9, description: "Monthly supplies", customerReference: "INV-1020" },
	{ title: "Photography", customer: 0, amount: "900.00", status: "pending", createdDaysAgo: 4, dueInDays: 6, description: "Wedding shoot balance", customerReference: "INV-1040" },
];

export const mockPaymentRequests: PaymentRequestData[] = SEED.map((seed, index) => {
	const reference = `REQ-${1001 + index}`;
	const createdAt = daysAgo(seed.createdDaysAgo);
	const hasPayment = seed.status === "paid" || seed.status === "flagged" || seed.status === "processing";
	return {
		id: `req_${1001 + index}`,
		reference,
		title: seed.title,
		customer: MOCK_CUSTOMERS[seed.customer]!,
		amount: seed.amount,
		currency: "USDC",
		description: seed.description,
		customerReference: seed.customerReference,
		dueAt: seed.dueInDays === null ? null : daysFromNow(seed.dueInDays),
		status: seed.status,
		url: `https://peakline.com/request/${reference.toLowerCase()}`,
		transactionId: hasPayment ? `mock-tx-${1001 + index}` : null,
		createdAt,
		updatedAt: createdAt,
	};
});
