import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAxiosAuth } from "@/hooks/useAxiosAuth";
import { apiRoutes } from "@/lib/config/apiRoutes";
import { splitPhoneForTransfer } from "@/lib/phone";
import type {
	ApiSuccessResponse,
	SendMoneyResponseData,
	TransferPreviewData,
	TransferStatusData,
} from "@/lib/api/types";
import type { SendMoneyValues } from "@/lib/validations/sendValidations";

interface SendMoneyPayload {
	values: SendMoneyValues;
	pin: string;
}

/** `SendMoneyDto`'s wire shape depends on `mode` — only the fields that
 * method actually needs get sent (the form's single `recipient` field
 * covers all three, split apart here). */
/** `pin` omitted = the preview body (same shape minus the PIN). */
function toSendMoneyBody(values: SendMoneyValues, pin?: string) {
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

/** `POST /transfers/preview` — recipient, network, fee, balance after, and
 * whether it can be sent (with `issues` when not). Nothing is debited. */
function useTransferPreview(values: SendMoneyValues | null) {
	const axiosAuth = useAxiosAuth();

	return useQuery({
		queryKey: ["transfers", "preview", values],
		queryFn: async () => {
			const { data } = await axiosAuth.post<ApiSuccessResponse<TransferPreviewData>>(
				apiRoutes.transfers.PREVIEW,
				toSendMoneyBody(values!),
			);
			return data.data;
		},
		enabled: !!values,
		retry: false,
		staleTime: 0,
	});
}

/** `GET /transfers/:id` — polled every 3s while `processing`. */
function useTransferStatus(id: string | null) {
	const axiosAuth = useAxiosAuth();

	return useQuery({
		queryKey: ["transfers", "status", id],
		queryFn: async () => {
			const { data } = await axiosAuth.get<ApiSuccessResponse<TransferStatusData>>(apiRoutes.transfers.byId(id!));
			return data.data;
		},
		enabled: !!id,
		refetchInterval: (query) => {
			const status = query.state.data?.status;
			return !status || status === "processing" || status === "pending" ? 3000 : false;
		},
	});
}

/** `POST /transfers/:id/recheck` — asks Stellar again; safe to repeat and
 * never pays twice. */
function useRecheckTransfer() {
	const axiosAuth = useAxiosAuth();
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (id: string) => {
			const { data } = await axiosAuth.post<ApiSuccessResponse<TransferStatusData>>(apiRoutes.transfers.recheck(id));
			return data.data;
		},
		onSuccess: (status) => {
			queryClient.setQueryData(["transfers", "status", status.transactionId], status);
			queryClient.invalidateQueries({ queryKey: ["dashboard", "balance"] });
		},
	});
}

export { useSendMoney, useTransferPreview, useTransferStatus, useRecheckTransfer };
export type { SendMoneyPayload };
