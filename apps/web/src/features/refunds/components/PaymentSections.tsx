"use client";

import { formatUsdc } from "@/lib/currency";
import { RECONCILIATION_STATUS_BADGE } from "@/lib/reconciliation";
import type { RefundablePaymentData } from "@/lib/api/types";
import { CopyRow, ExplorerRow, InfoRow, InfoSection, METHOD_LABEL, formatDateTime } from "./parts";

const RECONCILIATION_TEXT: Record<string, string> = {
	matched: "text-success-700",
	unmatched: "text-danger-600",
	amount_mismatch: "text-warning-700",
	failed: "text-danger-600",
};

/** "Payment Information" + "Transaction Verification", shared by the
 * Initiate Refund page (c4) and Refund Details (c6). */
function PaymentSections({ payment }: { payment: RefundablePaymentData }) {
	return (
		<div className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:gap-12">
			<InfoSection title="Payment Information">
				{payment.requestReference && <InfoRow label="Request ID" value={payment.requestReference} />}
				{payment.customerReference && <InfoRow label="Customer Reference" value={payment.customerReference} />}
				<InfoRow label="Expected Amount" value={`${formatUsdc(Number(payment.expectedAmount))} USDC`} />
				<InfoRow label="Received Amount" value={`${formatUsdc(Number(payment.amount))} USDC`} />
				<InfoRow label="Asset" value="USDC" />
				<InfoRow label="Payment Timestamp" value={formatDateTime(payment.paidAt)} />
				<InfoRow label="Payment Method" value={METHOD_LABEL[payment.method]} />
			</InfoSection>

			<InfoSection title="Transaction Verification">
				<InfoRow label="Network" value="Stellar Testnet" />
				<InfoRow label="Est. Fee" value="0.00 USDC" valueClassName="font-normal text-muted-foreground" />
				<InfoRow label="Payment Status" value="Paid" valueClassName="text-success-700" />
				<InfoRow
					label="Reconciliation Status"
					value={RECONCILIATION_STATUS_BADGE[payment.reconciliationStatus].label}
					valueClassName={RECONCILIATION_TEXT[payment.reconciliationStatus]}
				/>
				<CopyRow label="Transaction ID" value={payment.stellarTxHash} />
				<InfoRow label="Reference" value={payment.reference} valueClassName="font-normal" />
				<ExplorerRow hash={payment.stellarTxHash} />
			</InfoSection>
		</div>
	);
}

export { PaymentSections };
