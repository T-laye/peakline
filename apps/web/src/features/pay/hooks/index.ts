import { useMutation, useQuery } from "@tanstack/react-query";
import { useAxiosAuth } from "@/hooks/useAxiosAuth";
import { apiRoutes } from "@/lib/config/apiRoutes";
import { extractPaymentCode } from "@/lib/pay";
import type {
	ApiSuccessResponse,
	PaymentLinkClaimData,
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
			return { ...data.data, publicCode: code };
		},
	});
}

/** The code the claim endpoints are keyed by. `memo` is documented as equal
 * to the code, so it's a safe fallback if `publicCode` wasn't attached. */
function claimCode(link: PublicPaymentLinkData) {
	return link.publicCode ?? link.memo;
}

/** Step 1 of paying from an external wallet — registers the sender
 * address against the link and returns the claim the hash is verified
 * against in step 2. */
function useCreatePaymentClaim() {
	const axiosAuth = useAxiosAuth();

	return useMutation({
		mutationFn: async ({
			link,
			fromAddress,
		}: {
			link: PublicPaymentLinkData;
			fromAddress: string;
		}) => {
			const { data } = await axiosAuth.post<ApiSuccessResponse<PaymentLinkClaimData>>(
				apiRoutes.pay.claim(claimCode(link)),
				{ fromAddress },
			);
			return data.data;
		},
	});
}

/** Step 2 — submits the tx hash; the backend checks it on Horizon and
 * settles the claim. Any failed check is a 400 with a real reason in
 * `message`; see `PaymentLinkClaimData` for the full contract. */
function useVerifyPaymentClaim() {
	const axiosAuth = useAxiosAuth();

	return useMutation({
		mutationFn: async ({
			link,
			claimId,
			txHash,
		}: {
			link: PublicPaymentLinkData;
			claimId: string;
			txHash: string;
		}) => {
			const { data } = await axiosAuth.post<ApiSuccessResponse<PaymentLinkClaimData>>(
				apiRoutes.pay.claimVerify(claimCode(link), claimId),
				{ txHash },
			);
			return data.data;
		},
	});
}

/** "I've paid" — `POST /pay/:code/payment-hash`. The server checks the
 * transaction succeeded, carries this link's memo and pays the exact
 * amount, then moves the request to `processing`; it turns `paid` once the
 * ledger credit lands (poll `usePublicLinkStatus`). */
function useReportPaymentHash() {
	const axiosAuth = useAxiosAuth();

	return useMutation({
		mutationFn: async ({ link, hash }: { link: PublicPaymentLinkData; hash: string }) => {
			const { data } = await axiosAuth.post<
				ApiSuccessResponse<{ status: "processing" | "matched"; stellarTxHash: string }>
			>(apiRoutes.pay.paymentHash(claimCode(link)), { hash: hash.trim().toLowerCase() });
			return data.data;
		},
	});
}

/** Polls `GET /pay/:code` every 3s while `enabled` (after a hash report). */
function usePublicLinkStatus(link: PublicPaymentLinkData, enabled: boolean) {
	const axiosAuth = useAxiosAuth();

	return useQuery({
		queryKey: ["pay", "status", claimCode(link)],
		queryFn: async () => {
			const { data } = await axiosAuth.get<ApiSuccessResponse<PublicPaymentLinkData>>(
				apiRoutes.pay.byCode(claimCode(link)),
			);
			return data.data;
		},
		enabled,
		refetchInterval: (query) => (query.state.data?.status === "paid" ? false : 3000),
	});
}

export {
	usePaymentLinkLookup,
	useCreatePaymentClaim,
	useVerifyPaymentClaim,
	useReportPaymentHash,
	usePublicLinkStatus,
};
