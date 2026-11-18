"use client";

import { formatUsdc } from "@/lib/currency";
import { RECONCILIATION_STATUS_BADGE } from "@/lib/reconciliation";
import { STATUS_LABEL } from "@/lib/transactions";
import type { PaymentLinkData, ReconciliationData } from "@/lib/api/types";
import { CopyRow, ExplorerRow, InfoRow, InfoSection, formatDateTime, paymentMethodLabel } from "./parts";

const RECONCILIATION_TEXT: Record<string, string> = {
	matched: "text-success-700",
	unmatched: "text-danger-600",
	flagged: "text-warning-700",
	amount_mismatch: "text-warning-700",
	failed: "text-danger-600",
	pending: "text-info-700",
	reviewed: "text-muted-foreground",
};

/** "Payment Information" + "Transaction Verification", shared by the
 * Initiate Refund page (c4) and Refund Details (c6). `payment` is the
 * payment's reconciliation record; `request` the request it settled. */
function PaymentSections({
	payment,
	request,
}: {
	payment: ReconciliationData;
	request?: PaymentLinkData | null;
}) {
	return (
		<div className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:gap-12">
			<InfoSection title="Payment Information">
				{payment.paymentReference && <InfoRow label="Request ID" value={payment.paymentReference} />}
				{payment.customerReference && <InfoRow label="Customer Reference" value={payment.customerReference} />}
				{request && <InfoRow label="Expected Amount" value={`${formatUsdc(Number(request.amount))} USDC`} />}
				<InfoRow label="Received Amount" value={`${formatUsdc(Number(payment.amount))} ${payment.asset}`} />
				<InfoRow label="Asset" value={payment.asset} />
				<InfoRow label="Payment Timestamp" value={formatDateTime(payment.transactionDate)} />
				<InfoRow label="Payment Method" value={paymentMethodLabel(request)} />
			</InfoSection>

			<InfoSection title="Transaction Verification">
				<InfoRow label="Network" value="Stellar Testnet" />
				{payment.paymentStatus && (
					<InfoRow
						label="Payment Status"
						value={STATUS_LABEL[payment.paymentStatus]}
						valueClassName={payment.paymentStatus === "completed" ? "text-success-700" : undefined}
					/>
				)}
				<InfoRow
					label="Reconciliation Status"
					value={RECONCILIATION_STATUS_BADGE[payment.reconciliationStatus].label}
					valueClassName={RECONCILIATION_TEXT[payment.reconciliationStatus]}
				/>
				{payment.stellarTxHash && <CopyRow label="Transaction Hash" value={payment.stellarTxHash} />}
				<InfoRow label="Reference" value={payment.reference} valueClassName="font-normal" />
				{payment.stellarTxHash && <ExplorerRow hash={payment.stellarTxHash} />}
			</InfoSection>
		</div>
	);
}

export { PaymentSections };
