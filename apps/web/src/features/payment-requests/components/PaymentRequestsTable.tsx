"use client";

import Link from "next/link";
import { Eye, FileText } from "lucide-react";
import { EmptyState } from "@repo/ui/empty-state";
import { formatUsdc } from "@/lib/currency";
import type { PaymentLinkData } from "@/lib/api/types";
import { PaymentLinkStatusPill as PaymentRequestStatusPill } from "@/components/PaymentLinkStatusPill";

/** "12 Aug 2026". */
function formatRequestDate(iso: string | null | undefined) {
	if (!iso) return "—";
	return new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

function CardRow({ label, value }: { label: string; value: React.ReactNode }) {
	return (
		<div className="flex items-center justify-between gap-4">
			<span className="text-c1 text-muted-foreground">{label}</span>
			<span className="text-b3 font-medium text-foreground">{value}</span>
		</div>
	);
}

function ViewLink({ request }: { request: PaymentLinkData }) {
	return (
		<Link
			href={`/payment-requests/${request.id}`}
			aria-label={`View payment request ${request.reference}`}
			className="flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
		>
			<Eye className="size-4" aria-hidden="true" />
		</Link>
	);
}

/** Desktop table inside the mock's "Recent requests" card; stacked cards on
 * mobile, same convention as `PaymentLinksTable`. */
function PaymentRequestsTable({ requests }: { requests: PaymentLinkData[] }) {
	if (requests.length === 0) {
		return (
			<EmptyState
				icon={FileText}
				title="No payment requests yet"
				description="Nothing matches your current filters, or you haven't created a payment request yet."
			/>
		);
	}

	return (
		<>
			<div className="hidden overflow-hidden rounded-xl border border-border lg:block">
				<h2 className="px-5 py-4 text-b1 text-foreground">Recent requests</h2>
				<div className="overflow-x-auto">
					<table className="w-full border-collapse text-left">
						<thead>
							<tr className="bg-muted">
								{[
									"Request ID",
									"Customer",
									"Amount (USDC)",
									"Due Date",
									"Date Created",
									"Payment Reference",
									"Status",
									"Action",
								].map((heading) => (
									<th key={heading} className="p-4 text-label whitespace-nowrap text-muted-foreground">
										{heading}
									</th>
								))}
							</tr>
						</thead>
						<tbody>
							{requests.map((request) => (
								<tr key={request.id} className="border-t border-border hover:bg-muted/50">
									<td className="p-4 text-b3 font-medium text-foreground">#{request.reference}</td>
									<td className="p-4 text-b3 text-foreground">{(request.customerName ?? request.customerEmail ?? "—")}</td>
									<td className="p-4 text-b3 whitespace-nowrap text-foreground">
										{formatUsdc(Number(request.amount))} {request.currency}
									</td>
									<td className="p-4 text-b3 whitespace-nowrap text-foreground">
										{formatRequestDate(request.expiresAt)}
									</td>
									<td className="p-4 text-b3 whitespace-nowrap text-foreground">
										{formatRequestDate(request.createdAt)}
									</td>
									<td className="p-4 text-b3 text-foreground">{request.customerReference ?? "—"}</td>
									<td className="p-4">
										<PaymentRequestStatusPill status={request.status} />
									</td>
									<td className="p-4">
										<ViewLink request={request} />
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			</div>

			<div className="flex flex-col gap-3 lg:hidden">
				{requests.map((request) => (
					<div key={request.id} className="flex flex-col gap-3 rounded-xl border border-border p-4">
						<CardRow label="Request ID" value={`#${request.reference}`} />
						<CardRow label="Customer" value={(request.customerName ?? request.customerEmail ?? "—")} />
						<CardRow
							label="Amount (USDC)"
							value={`${formatUsdc(Number(request.amount))} ${request.currency}`}
						/>
						<CardRow label="Due Date" value={formatRequestDate(request.expiresAt)} />
						<CardRow label="Status" value={<PaymentRequestStatusPill status={request.status} />} />
						<div className="flex justify-end">
							<ViewLink request={request} />
						</div>
					</div>
				))}
			</div>
		</>
	);
}

export { PaymentRequestsTable };
