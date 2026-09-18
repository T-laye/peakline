import { useMutation } from "@tanstack/react-query";
import { useAxiosAuth } from "@/hooks/useAxiosAuth";
import { apiRoutes } from "@/lib/config/apiRoutes";
import { extractPaymentCode } from "@/lib/pay";
import type { ApiSuccessResponse, PublicPaymentLinkData } from "@/lib/api/types";

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

export { usePaymentLinkLookup };
