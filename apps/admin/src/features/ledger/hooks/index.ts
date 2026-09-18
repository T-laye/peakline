import { useQuery } from "@tanstack/react-query";
import { useAxiosAuth } from "@/hooks/useAxiosAuth";
import { apiRoutes } from "@/lib/config/apiRoutes";
import type { UnknownRecord } from "@/lib/api/types";

const LEDGER_ACCOUNTS_KEY = ["admin", "ledger-accounts"];
const SYSTEM_ACCOUNTS_KEY = ["admin", "ledger-system-accounts"];
const BALANCES_KEY = ["admin", "ledger-balances"];

export interface LedgerAccountsQuery {
	userId?: string;
	businessId?: string;
	accountType?: "user" | "system";
	currency?: "USDC" | "GHS";
}

export interface LedgerBalancesQuery {
	userId?: string;
	businessId?: string;
	currency?: "USDC" | "GHS";
}

/** None of the Ledger group's real response shapes are confirmed (see
 * `UnknownRecord`'s own note) — every hook here fetches real data but
 * keeps it typed `unknown`, rendered generically (`DynamicTable`/
 * `DynamicRecord`) rather than asserting fields that might not exist. */
function useLedgerAccounts(query: LedgerAccountsQuery, page: number, limit: number) {
	const axiosAuth = useAxiosAuth();

	return useQuery({
		queryKey: [...LEDGER_ACCOUNTS_KEY, query, page, limit],
		queryFn: async () => {
			const { data } = await axiosAuth.get<{ data: unknown; meta?: unknown }>(
				apiRoutes.ledger.ACCOUNTS,
				{ params: { ...query, page, limit } },
			);
			return {
				accounts: (data.data as UnknownRecord[] | null) ?? [],
				meta: data.meta as
					| { totalCount: number; pageCount: number; currentPage: number }
					| undefined,
			};
		},
	});
}

function useLedgerAccount(id: string) {
	const axiosAuth = useAxiosAuth();

	return useQuery({
		queryKey: [...LEDGER_ACCOUNTS_KEY, id],
		queryFn: async () => {
			const { data } = await axiosAuth.get<{ data: unknown }>(apiRoutes.ledger.byAccountId(id));
			return data.data as UnknownRecord | null;
		},
		enabled: !!id,
	});
}

function useSystemAccounts() {
	const axiosAuth = useAxiosAuth();

	return useQuery({
		queryKey: SYSTEM_ACCOUNTS_KEY,
		queryFn: async () => {
			const { data } = await axiosAuth.get<{ data: unknown }>(apiRoutes.ledger.SYSTEM_ACCOUNTS);
			// "Get system float accounts with balances" — plural in the
			// summary, so treated as a list; falls back to wrapping a single
			// object in an array if that's what actually comes back, so
			// `DynamicTable` still has something sensible to render either way.
			const raw = data.data;
			if (Array.isArray(raw)) return raw as UnknownRecord[];
			if (raw && typeof raw === "object") return [raw as UnknownRecord];
			return [];
		},
	});
}

function useLedgerBalances(query: LedgerBalancesQuery, page: number, limit: number) {
	const axiosAuth = useAxiosAuth();

	return useQuery({
		queryKey: [...BALANCES_KEY, query, page, limit],
		queryFn: async () => {
			const { data } = await axiosAuth.get<{ data: unknown; meta?: unknown }>(
				apiRoutes.ledger.BALANCES,
				{ params: { ...query, page, limit } },
			);
			return {
				balances: (data.data as UnknownRecord[] | null) ?? [],
				meta: data.meta as
					| { totalCount: number; pageCount: number; currentPage: number }
					| undefined,
			};
		},
	});
}

export { useLedgerAccounts, useLedgerAccount, useSystemAccounts, useLedgerBalances };
