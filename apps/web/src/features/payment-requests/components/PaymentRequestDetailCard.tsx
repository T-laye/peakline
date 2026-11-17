import { formatUsdc, usdcToGhs } from "@/lib/currency";
import type { PaymentRequestData } from "@/lib/api/types";
import { PaymentRequestStatusPill, formatRequestDate } from "./PaymentRequestStatusPill";

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
	return (
		<div className="flex items-center justify-between gap-4 py-3 text-c1 sm:text-b3">
			<span className="text-muted-foreground">{label}</span>
			<span className="text-right font-semibold text-foreground">{value}</span>
		</div>
	);
}

/** Left receipt card on `/payment-requests/[id]` (c3 mock) — same gold
 * treatment as `PaymentLinkDetailCard`. The create form has no title field,
 * so requests without one fall back to "Payment Request". */
function PaymentRequestDetailCard({ request }: { request: PaymentRequestData }) {
	const amount = Number(request.amount);

	return (
		<div className="flex flex-col gap-5 rounded-2xl border border-secondary-300 bg-secondary-100 p-6 sm:p-8">
			<div className="flex flex-col items-center gap-3 text-center">
				<h2 className="text-s1 text-foreground sm:text-h5">{request.title || "Payment Request"}</h2>
				<PaymentRequestStatusPill status={request.status} />
			</div>

			<div className="flex flex-col gap-1 rounded-xl border border-secondary-300 bg-background p-4 sm:p-5">
				<span className="text-h5 text-foreground sm:text-h4">
					{formatUsdc(amount)} {request.currency}
				</span>
				<span className="text-c1 text-muted-foreground sm:text-b3">
					~ GHS {formatUsdc(usdcToGhs(amount))}
				</span>
			</div>

			<div className="flex flex-col">
				<DetailRow label="Request ID" value={`#${request.reference}`} />
				<DetailRow label="Customer Reference" value={request.customerReference ?? "—"} />
				<DetailRow
					label="Customer Details"
					value={
						<span className="flex flex-col items-end">
							{request.customer.name}
							{request.customer.email && (
								<span className="font-normal text-muted-foreground">{request.customer.email}</span>
							)}
						</span>
					}
				/>
				<DetailRow label="Requested Amount" value={formatUsdc(amount)} />
				<DetailRow label="Asset" value={request.currency} />
				<DetailRow label="Description" value={request.description ?? "—"} />
				<DetailRow label="Creation Date" value={formatRequestDate(request.createdAt)} />
				<DetailRow label="Due Date" value={formatRequestDate(request.dueAt)} />
				<DetailRow label="Request Status" value={<PaymentRequestStatusPill status={request.status} />} />
			</div>
		</div>
	);
}

export { PaymentRequestDetailCard };
