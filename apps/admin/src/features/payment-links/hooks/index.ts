import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAxiosAuth } from "@/hooks/useAxiosAuth";
import { apiRoutes } from "@/lib/config/apiRoutes";
import type {
	AdminCancelPaymentLinkPayload,
	AdminPaymentLinkData,
	AdminPaymentLinksQuery,
	PaginatedResponse,
} from "@/lib/api/types";

const PAYMENT_LINKS_KEY = ["admin", "payment-links"];

function useAdminPaymentLinks(query: AdminPaymentLinksQuery, page: number, limit: number) {
	const axiosAuth = useAxiosAuth();

	return useQuery({
		queryKey: [...PAYMENT_LINKS_KEY, query, page, limit],
		queryFn: async () => {
			const { data } = await axiosAuth.get<PaginatedResponse<AdminPaymentLinkData>>(
				apiRoutes.paymentLinks.BASE,
				{ params: { ...query, page, limit } },
			);
			return { links: data.data, meta: data.meta };
		},
	});
}

function useAdminPaymentLink(id: string) {
	const axiosAuth = useAxiosAuth();

	return useQuery({
		queryKey: [...PAYMENT_LINKS_KEY, id],
		queryFn: async () => {
			const { data } = await axiosAuth.get<{ data: AdminPaymentLinkData }>(
				apiRoutes.paymentLinks.byId(id),
			);
			return data.data;
		},
		enabled: !!id,
	});
}

/** Super_admin isn't required here (unlike Config/Staff) — cancelling a
 * payment link is force-cancel-by-support-staff territory, same "any
 * staff" bar as wallet deactivate. Response `data` is `null` per the real
 * spec (confirmed, not a documentation-bug guess this time) — nothing to
 * return, just invalidate so the list/detail re-fetch the new status. */
function useCancelAdminPaymentLink(id: string) {
	const axiosAuth = useAxiosAuth();
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (payload: AdminCancelPaymentLinkPayload) => {
			await axiosAuth.patch(apiRoutes.paymentLinks.byIdCancel(id), payload);
		},
		onSuccess: () => queryClient.invalidateQueries({ queryKey: PAYMENT_LINKS_KEY }),
	});
}

export { useAdminPaymentLinks, useAdminPaymentLink, useCancelAdminPaymentLink };
