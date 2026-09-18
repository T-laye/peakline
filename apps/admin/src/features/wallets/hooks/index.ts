import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAxiosAuth } from "@/hooks/useAxiosAuth";
import { apiRoutes } from "@/lib/config/apiRoutes";
import type {
	AdminFundingIntentData,
	AdminFundingIntentsQuery,
	AdminWalletActionPayload,
	AdminWalletData,
	AdminWalletsQuery,
	PaginatedResponse,
} from "@/lib/api/types";

const WALLETS_KEY = ["admin", "wallets"];
const FUNDING_INTENTS_KEY = ["admin", "wallet-funding-intents"];

function useAdminWallets(query: AdminWalletsQuery, page: number, limit: number) {
	const axiosAuth = useAxiosAuth();

	return useQuery({
		queryKey: [...WALLETS_KEY, query, page, limit],
		queryFn: async () => {
			const { data } = await axiosAuth.get<PaginatedResponse<AdminWalletData>>(
				apiRoutes.wallets.BASE,
				{ params: { ...query, page, limit } },
			);
			return { wallets: data.data, meta: data.meta };
		},
	});
}

function useAdminWallet(id: string) {
	const axiosAuth = useAxiosAuth();

	return useQuery({
		queryKey: [...WALLETS_KEY, id],
		queryFn: async () => {
			const { data } = await axiosAuth.get<{ data: AdminWalletData }>(
				apiRoutes.wallets.byId(id),
			);
			return data.data;
		},
		enabled: !!id,
	});
}

function useInvalidateWallets() {
	const queryClient = useQueryClient();
	return () => queryClient.invalidateQueries({ queryKey: WALLETS_KEY });
}

function useDeactivateWallet(id: string) {
	const axiosAuth = useAxiosAuth();
	const invalidate = useInvalidateWallets();

	return useMutation({
		mutationFn: async (payload: AdminWalletActionPayload) => {
			const { data } = await axiosAuth.patch<{ data: AdminWalletData }>(
				apiRoutes.wallets.byIdDeactivate(id),
				payload,
			);
			return data.data;
		},
		onSuccess: invalidate,
	});
}

/** Super_admin only per the backend's own guard — no request body. */
function useReactivateWallet(id: string) {
	const axiosAuth = useAxiosAuth();
	const invalidate = useInvalidateWallets();

	return useMutation({
		mutationFn: async () => {
			const { data } = await axiosAuth.patch<{ data: AdminWalletData }>(
				apiRoutes.wallets.byIdReactivate(id),
			);
			return data.data;
		},
		onSuccess: invalidate,
	});
}

/** Real response schema is undocumented (see `AdminFundingIntentData`'s
 * own note) — typed defensively. */
function useWalletFundingIntents(
	walletId: string,
	query: AdminFundingIntentsQuery,
	page: number,
	limit: number,
) {
	const axiosAuth = useAxiosAuth();

	return useQuery({
		queryKey: [...FUNDING_INTENTS_KEY, walletId, query, page, limit],
		queryFn: async () => {
			const { data } = await axiosAuth.get<{ data: unknown; meta?: unknown }>(
				apiRoutes.wallets.byIdFundingIntents(walletId),
				{ params: { ...query, page, limit } },
			);
			const intents = (data.data as AdminFundingIntentData[] | null) ?? [];
			return intents;
		},
		enabled: !!walletId,
	});
}

export {
	useAdminWallets,
	useAdminWallet,
	useDeactivateWallet,
	useReactivateWallet,
	useWalletFundingIntents,
};
