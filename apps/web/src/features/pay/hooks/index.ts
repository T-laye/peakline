import { useMutation } from "@tanstack/react-query";
import { useAxiosAuth } from "@/hooks/useAxiosAuth";
import { apiRoutes } from "@/lib/config/apiRoutes";
import { extractPaymentCode } from "@/lib/pay";
import type {
	ApiSuccessResponse,
	ExternalPaymentVerificationData,
	PublicPaymentLinkData,
} from "@/lib/api/types";

/** `GET /pay/{code}` is public (no auth required), but every route this app
 * calls it from is already behind the dashboard's own auth gate, so reusing
 * the same authenticated axios instance as everything else is simpler than
 * standing up a second unauthenticated one just for this call. Triggered by
 * the code-entry form's own submit, not a live query — same "fetch on an
 * explicit action" shape the old fake `useScanMerchantQr` had. */
function usePaymentLinkLookup() {
	const axiosAuth = useAxiosAuth();

	return useMutation({
		mutationFn: async (input: string) => {
			const code = extractPaymentCode(input);
			const { data } = await axiosAuth.get<ApiSuccessResponse<PublicPaymentLinkData>>(
				apiRoutes.pay.byCode(code),
			);
			return data.data;
		},
	});
}

interface VerifyExternalPaymentInput {
	link: PublicPaymentLinkData;
	senderAddress: string;
	txHash: string;
}

async function fakeRequest<T>(payload: T, delay = 1800): Promise<T> {
	await new Promise((resolve) => setTimeout(resolve, delay));
	return payload;
}

/**
 * Verifies a payment the payer made from an external Stellar wallet against
 * the payment link they were paying.
 *
 * STUBBED — the backend endpoint doesn't exist yet. When it lands, add it
 * to `apiRoutes.pay` and swap this `mutationFn` for the real call (likely
 * `POST` with `{ code: link.memo, senderAddress, txHash }`). Nothing in
 * the components needs to change as long as the response matches
 * `ExternalPaymentVerificationData` — adjust that type if it doesn't.
 *
 * Until then, the hash's LAST character picks the outcome, so every screen
 * can be reached by hand:
 *   - ends in `0` → transaction not found (error → /pay/external/failed)
 *   - ends in `1` → underpaid amount (→ /pay/external/reconciliation)
 *   - ends in `2` → memo missing/wrong (→ /pay/external/reconciliation)
 *   - anything else → verified (→ /pay/external/verified)
 */
function useVerifyExternalPayment() {
	return useMutation({
		mutationFn: async ({ link, senderAddress, txHash }: VerifyExternalPaymentInput) => {
			const outcome = txHash.at(-1);
			if (outcome === "0") {
				await fakeRequest(null);
				throw new Error("Transaction not found");
			}

			const expected = Number(link.amount);
			const received = outcome === "1" ? expected * 0.8 : expected;
			const issues: ExternalPaymentVerificationData["issues"] =
				outcome === "1" ? ["amount_mismatch"] : outcome === "2" ? ["memo_mismatch"] : [];

			return fakeRequest<ExternalPaymentVerificationData>({
				status: issues.length > 0 ? "needs_reconciliation" : "verified",
				stellarTxHash: txHash,
				senderAddress,
				expectedAmount: expected.toFixed(2),
				receivedAmount: received.toFixed(2),
				currency: "USDC",
				issues,
				reconciliationReference:
					issues.length > 0 ? `REC-${txHash.slice(0, 8).toUpperCase()}` : null,
				verifiedAt: new Date().toISOString(),
			});
		},
	});
}

export { usePaymentLinkLookup, useVerifyExternalPayment };
