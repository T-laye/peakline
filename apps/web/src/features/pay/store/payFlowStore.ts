import { create } from "zustand";
import type {
	PaymentLinkClaimData,
	PublicPaymentLinkData,
	SendMoneyResponseData,
} from "@/lib/api/types";

/**
 * Carries state across the Pay route sequence
 * (/pay -> /confirm -> /processing -> /success | /failed). Mirrors
 * `useSendMoneyFlowStore` — deliberately NOT persisted, same reasoning as
 * that one.
 *
 * `link` is the real `GET /pay/{code}` result — a fixed amount/destination/
 * memo, not a payer-entered amount (there's no "pay this merchant any
 * amount" endpoint; only a specific payment link has one). Paying it is
 * just a `POST /transfers/send` in `mode: "wallet"` against the link's own
 * `destinationAddress`, reusing `useSendMoney` directly rather than
 * duplicating transfer logic here — `result`/`errorMessage` hold that same
 * call's real outcome, same shape as the Send flow's own store.
 *
 * The external-wallet branch (/pay/external -> /transaction -> /verifying
 * -> /verified | /reconciliation | /failed) shares the same `link` and
 * `errorMessage`: the payer registers the wallet they're paying from
 * (`POST /pay/{code}/claim` → `externalClaimId`), sends USDC from it outside
 * Peakline, then submits the transaction hash against that claim.
 * `verification` holds the settled claim.
 */
interface PayFlowState {
	link: PublicPaymentLinkData | null;
	pin: string | null;
	result: SendMoneyResponseData | null;
	errorMessage: string | null;
	externalSenderAddress: string | null;
	externalClaimId: string | null;
	externalTxHash: string | null;
	/** The settled claim returned by the verify step. */
	verification: PaymentLinkClaimData | null;
	setLink: (link: PublicPaymentLinkData) => void;
	setPin: (pin: string) => void;
	setResult: (result: SendMoneyResponseData) => void;
	setErrorMessage: (message: string) => void;
	/** Sender address and the claim registered for it always change
	 * together — a different address means a different claim. */
	setExternalClaim: (senderAddress: string, claimId: string) => void;
	/** A claim that failed verification can't be verified again — the
	 * backend wants a new one — so it's dropped (the address is kept). */
	discardExternalClaim: () => void;
	setExternalTxHash: (hash: string) => void;
	setVerification: (verification: PaymentLinkClaimData) => void;
	reset: () => void;
}

const usePayFlowStore = create<PayFlowState>()((set) => ({
	link: null,
	pin: null,
	result: null,
	errorMessage: null,
	externalSenderAddress: null,
	externalClaimId: null,
	externalTxHash: null,
	verification: null,
	setLink: (link) => set({ link }),
	setPin: (pin) => set({ pin }),
	setResult: (result) => set({ result }),
	setErrorMessage: (errorMessage) => set({ errorMessage }),
	setExternalClaim: (externalSenderAddress, externalClaimId) =>
		set({ externalSenderAddress, externalClaimId }),
	discardExternalClaim: () => set({ externalClaimId: null }),
	setExternalTxHash: (externalTxHash) => set({ externalTxHash }),
	setVerification: (verification) => set({ verification }),
	reset: () =>
		set({
			link: null,
			pin: null,
			result: null,
			errorMessage: null,
			externalSenderAddress: null,
			externalClaimId: null,
			externalTxHash: null,
			verification: null,
		}),
}));

export { usePayFlowStore };
