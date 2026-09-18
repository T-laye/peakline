import { create } from "zustand";
import type { SendMoneyValues } from "@/lib/validations/sendValidations";
import type { SendMoneyResponseData } from "@/lib/api/types";

/**
 * Carries state across the Send route sequence
 * (/send -> /review -> /processing -> /success | /failed). Mirrors
 * `fundWalletFlowStore` — deliberately NOT persisted, since this is a few
 * seconds of in-flight flow state, not something that should survive a hard
 * refresh mid-transfer.
 *
 * `pin` only lives here for the short hop between Review (where it's
 * entered) and Processing (where it's sent) — never persisted, cleared on
 * `reset()` like everything else. `result`/`errorMessage` hold the real
 * `POST /transfers/send` outcome so Success/Failed can show what actually
 * happened instead of just echoing back the form's own input.
 */
interface SendMoneyFlowState {
	values: SendMoneyValues | null;
	pin: string | null;
	result: SendMoneyResponseData | null;
	errorMessage: string | null;
	setValues: (values: SendMoneyValues) => void;
	setPin: (pin: string) => void;
	setResult: (result: SendMoneyResponseData) => void;
	setErrorMessage: (message: string) => void;
	reset: () => void;
}

const useSendMoneyFlowStore = create<SendMoneyFlowState>()((set) => ({
	values: null,
	pin: null,
	result: null,
	errorMessage: null,
	setValues: (values) => set({ values }),
	setPin: (pin) => set({ pin }),
	setResult: (result) => set({ result }),
	setErrorMessage: (errorMessage) => set({ errorMessage }),
	reset: () => set({ values: null, pin: null, result: null, errorMessage: null }),
}));

export { useSendMoneyFlowStore };
