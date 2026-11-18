/** Readable copy for the `issues` codes the API returns on transfer
 * previews/sends and refund authorization (frontend-integration.md §4.4,
 * §5.1). Unknown codes fall back to a humanized version of the code. */
const ISSUE_COPY: Record<string, string> = {
	insufficient_balance: "There isn't enough USDC in the wallet for this amount.",
	no_wallet: "There's no Stellar wallet set up yet.",
	source_account_not_found: "The sending wallet isn't activated on Stellar yet.",
	source_missing_usdc_trustline: "The sending wallet can't hold USDC yet (no USDC trustline).",
	source_insufficient_usdc: "The sending wallet doesn't have enough USDC.",
	source_insufficient_xlm_for_fee: "The sending wallet needs a little XLM to pay the Stellar network fee.",
	destination_account_not_found: "The receiving wallet doesn't exist on Stellar yet.",
	destination_missing_usdc_trustline: "The receiving wallet can't accept USDC (no USDC trustline).",
};

export function describeIssue(code: string) {
	return ISSUE_COPY[code] ?? code.replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase());
}

/** Flag `reason` codes on flagged payments (§3.7). */
const FLAG_REASON_COPY: Record<string, string> = {
	wrong_amount: "Amount differs from the request",
	no_memo: "Payment had no memo",
	unknown_memo: "Memo didn't match any of your links",
	expired_request: "Paid after the due date",
	cancelled_request: "Paid after the request was cancelled",
	duplicate_payment: "Request was already paid",
	wrong_asset: "Not USDC (not credited)",
	wrong_issuer: "USDC from an unrecognised issuer (not credited)",
	ingest_error: "Couldn't be processed automatically — contact support",
	wallet_deactivated: "Received by a deactivated wallet (not credited)",
};

export function describeFlagReason(reason: string) {
	return FLAG_REASON_COPY[reason] ?? describeIssue(reason);
}
