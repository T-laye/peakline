import { create } from "zustand";
import type { PublicPaymentLinkData, SendMoneyResponseData } from "@/lib/api/types";

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
 */
interface PayFlowState {
	link: PublicPaymentLinkData | null;
	pin: string | null;
	result: SendMoneyResponseData | null;
	errorMessage: string | null;
	setLink: (link: PublicPaymentLinkData) => void;
	setPin: (pin: string) => void;
	setResult: (result: SendMoneyResponseData) => void;
	setErrorMessage: (message: string) => void;
	reset: () => void;
}

const usePayFlowStore = create<PayFlowState>()((set) => ({
	link: null,
	pin: null,
	result: null,
	errorMessage: null,
	setLink: (link) => set({ link }),
	setPin: (pin) => set({ pin }),
	setResult: (result) => set({ result }),
	setErrorMessage: (errorMessage) => set({ errorMessage }),
	reset: () => set({ link: null, pin: null, result: null, errorMessage: null }),
}));

export { usePayFlowStore };
