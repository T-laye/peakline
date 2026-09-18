import { create } from "zustand";
import type { FundWalletValues } from "@/lib/validations/walletValidations";
import type { FundQuoteData, FundWalletResultData } from "@/lib/api/types";

/**
 * Carries state across the mobile Fund Wallet route sequence
 * (/wallet/fund -> /confirm -> /processing -> /success | /failed) — the
 * desktop modal doesn't need this, it just keeps the same values in local
 * state since it never unmounts between steps. Deliberately NOT persisted:
 * this is a few seconds of in-flight flow state, not something that should
 * survive a hard refresh (imagine re-confirming a stale amount after
 * refreshing mid-flow).
 *
 * `quote` is the real `POST /wallets/stellar/fund/quote` result Confirm
 * fetches — carried forward so Processing knows the exact `receiveAmount`
 * to actually deposit. `result`/`errorMessage` hold the real
 * `POST /wallets/stellar/fund` outcome, same shape as the Send/Pay flow
 * stores' own real-outcome fields.
 */
interface FundWalletFlowState {
	values: FundWalletValues | null;
	quote: FundQuoteData | null;
	result: FundWalletResultData | null;
	errorMessage: string | null;
	setValues: (values: FundWalletValues) => void;
	setQuote: (quote: FundQuoteData) => void;
	setResult: (result: FundWalletResultData) => void;
	setErrorMessage: (message: string) => void;
	reset: () => void;
}

const useFundWalletFlowStore = create<FundWalletFlowState>()((set) => ({
	values: null,
	quote: null,
	result: null,
	errorMessage: null,
	setValues: (values) => set({ values }),
	setQuote: (quote) => set({ quote }),
	setResult: (result) => set({ result }),
	setErrorMessage: (errorMessage) => set({ errorMessage }),
	reset: () => set({ values: null, quote: null, result: null, errorMessage: null }),
}));

export { useFundWalletFlowStore };
