import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAxiosAuth } from "@/hooks/useAxiosAuth";
import { apiRoutes } from "@/lib/config/apiRoutes";
import { splitPhoneForTransfer } from "@/lib/phone";
import type { ApiSuccessResponse, SendMoneyResponseData } from "@/lib/api/types";
import type { SendMoneyValues } from "@/lib/validations/sendValidations";

interface SendMoneyPayload {
	values: SendMoneyValues;
	pin: string;
}

/** `SendMoneyDto`'s wire shape depends on `mode` — only the fields that
 * method actually needs get sent (the form's single `recipient` field
 * covers all three, split apart here). */
function toSendMoneyBody(values: SendMoneyValues, pin: string) {
	const shared = {
		amount: values.amount.toFixed(2),
		pin,
		note: values.note || undefined,
	};

	if (values.method === "phone") {
		const split = splitPhoneForTransfer(values.recipient);
		if (!split) throw new Error("Enter a valid phone number");
		return {
			mode: "phone" as const,
			countryCode: split.countryCode,
			phoneNumber: split.phoneNumber,
			...shared,
		};
	}
	if (values.method === "username") {
		return { mode: "username" as const, username: values.recipient, ...shared };
	}
	return { mode: "wallet" as const, walletAddress: values.recipient, ...shared };
}

/** Fired by the Processing step on mount — a real send now, not a fake
 * delay-then-coinflip. `PIN_NOT_SET` (the account has no transaction PIN
 * yet — shouldn't happen in practice since sign-up's own `SetPinForm`
 * already requires one, but a real error code the backend can return) isn't
 * specially routed anywhere yet; it just surfaces via `getApiErrorMessage`
 * like any other failure on the Failed step. */
function useSendMoney() {
	const axiosAuth = useAxiosAuth();
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async ({ values, pin }: SendMoneyPayload) => {
			const body = toSendMoneyBody(values, pin);
			const { data } = await axiosAuth.post<ApiSuccessResponse<SendMoneyResponseData>>(
				apiRoutes.transfers.SEND,
				body,
			);
			return data.data;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["dashboard", "balance"] });
		},
	});
}

export { useSendMoney };
export type { SendMoneyPayload };
