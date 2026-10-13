import { isAxiosError } from "axios";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAxiosAuth } from "@/hooks/useAxiosAuth";
import { apiRoutes } from "@/lib/config/apiRoutes";
import type { ApiSuccessResponse, BusinessData, StellarWalletData } from "@/lib/api/types";
import type { UpdateBusinessValues } from "@/lib/validations/businessValidations";

const MY_BUSINESS_KEY = ["business", "mine"];

/** `GET /businesses` returns every business the account owns, but the app
 * only ever creates one per merchant (see the sign-up onboarding step) —
 * this surfaces just the first, same "one business per merchant" assumption
 * the rest of the app already makes (e.g. `useAccountDisplayName`). Returns
 * `null` (not an error) for a merchant account that skipped/never completed
 * Business Information. */
function useMyBusiness(options?: { enabled?: boolean }) {
	const axiosAuth = useAxiosAuth();

	return useQuery({
		queryKey: MY_BUSINESS_KEY,
		queryFn: async () => {
			const { data } = await axiosAuth.get<ApiSuccessResponse<BusinessData[]>>(
				apiRoutes.businesses.BASE,
			);
			return data.data[0] ?? null;
		},
		enabled: options?.enabled,
	});
}

/** Both `POST` and `PATCH /businesses` take this same shape — factored out
 * so the two hooks below can't drift apart on which fields they send. */
function toBusinessPayload(values: UpdateBusinessValues) {
	return {
		name: values.name,
		category: values.category,
		country: values.country,
		city: values.city || undefined,
		address: values.address || undefined,
		phone: values.phone || undefined,
		website: values.website || undefined,
		description: values.description || undefined,
		registrationNumber: values.registrationNumber || undefined,
		taxId: values.taxId || undefined,
	};
}

/** Creates the account's business — previously only reachable from
 * sign-up's Business Information step (merchant onboarding), with no way
 * to add one afterward if that step was skipped or the business later
 * deleted (reported live: "where can i add businesses?"). Used by
 * `BusinessInformationCard`'s own empty state. */
function useCreateBusiness() {
	const axiosAuth = useAxiosAuth();
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (values: UpdateBusinessValues) => {
			const { data } = await axiosAuth.post<ApiSuccessResponse<BusinessData>>(
				apiRoutes.businesses.BASE,
				toBusinessPayload(values),
			);
			return data.data;
		},
		onSuccess: (business) => queryClient.setQueryData(MY_BUSINESS_KEY, business),
	});
}

function useUpdateBusiness(id: string) {
	const axiosAuth = useAxiosAuth();
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (values: UpdateBusinessValues) => {
			const { data } = await axiosAuth.patch<ApiSuccessResponse<BusinessData>>(
				apiRoutes.businesses.byId(id),
				toBusinessPayload(values),
			);
			return data.data;
		},
		onSuccess: (business) => queryClient.setQueryData(MY_BUSINESS_KEY, business),
	});
}

/** Soft delete — the business stops appearing in `GET /businesses`
 * afterward (per the endpoint's own description), so invalidating is
 * enough to make it disappear from the card too. */
function useDeleteBusiness(id: string) {
	const axiosAuth = useAxiosAuth();
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: () => axiosAuth.delete(apiRoutes.businesses.byId(id)),
		onSuccess: () => queryClient.invalidateQueries({ queryKey: MY_BUSINESS_KEY }),
	});
}

/**
 * `POST /businesses/{id}/wallet` — a real, confirmed-live endpoint that
 * nothing in this app ever called (see `apiRoutes.businesses.byIdWallet`'s
 * own "not called anywhere right now" note). Reported live: a merchant
 * could sign up, verify, and create payment links with an active business
 * the whole time, yet every payment against it failed with "Merchant has
 * not created a wallet for this business yet" — because nothing ever
 * actually created one. `POST /wallets/stellar` (`useSetupWallet`, during
 * sign-up) only ever provisions the *person's own* wallet; a business's
 * payment links/QR deposit into its own separate wallet, which this is the
 * only way to create.
 *
 * 409 ("each business gets exactly one") is treated as success, not an
 * error — same tolerant-of-already-exists shape `useSetupWallet` already
 * uses for the personal wallet, so this is safe to call speculatively
 * (sign-up, or a self-heal check on every load — see `AuthProvider`)
 * without first checking whether one exists.
 */
function useCreateBusinessWallet() {
	const axiosAuth = useAxiosAuth();
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (businessId: string) => {
			try {
				const { data } = await axiosAuth.post<ApiSuccessResponse<StellarWalletData>>(
					apiRoutes.businesses.byIdWallet(businessId),
				);
				return data.data;
			} catch (error) {
				if (isAxiosError(error) && error.response?.status === 409) return null;
				throw error;
			}
		},
		onSuccess: () => queryClient.invalidateQueries({ queryKey: MY_BUSINESS_KEY }),
	});
}

export {
	useMyBusiness,
	useCreateBusiness,
	useUpdateBusiness,
	useDeleteBusiness,
	useCreateBusinessWallet,
};
