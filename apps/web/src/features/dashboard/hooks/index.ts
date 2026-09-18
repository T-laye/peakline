import { useQuery } from "@tanstack/react-query";
import { useAxiosAuth } from "@/hooks/useAxiosAuth";
import { apiRoutes } from "@/lib/config/apiRoutes";
import { useMyWallet } from "@/features/wallet/hooks";
import type { ApiSuccessResponse, BalanceData, TransactionData } from "@/lib/api/types";

interface WalletBalanceSummary {
	amount: number;
	currency: string;
	localAmount: number;
	localCurrency: string;
}

function findWalletAmount(
	balances: { currency: string; amount: string }[] | undefined,
	currency: string,
) {
	return Number(balances?.find((b) => b.currency === currency)?.amount ?? 0);
}

function findLedgerAmount(balances: BalanceData[] | undefined, currency: string) {
	return Number(balances?.find((b) => b.currency === currency)?.balance ?? 0);
}

/**
 * The account's real, single balance display — combined from BOTH real
 * sources on purpose, after each turned out to be individually incomplete
 * in opposite directions, reported live both ways:
 *
 * - `GET /wallets/stellar`'s own `balances` (via `useMyWallet`) is "live
 *   from Horizon" for USDC — accurate for anything that actually moved on
 *   the Stellar network (the testnet faucet, an external wallet sending
 *   USDC in) — but a purely-internal transfer from another Peakline user
 *   settles through the ledger with NO on-chain movement at all (confirmed
 *   live: `SendMoneyResponseDto.stellarTxHash` is null for that case), so
 *   this alone can show nothing for money just received from another
 *   Peakline account.
 * - `GET /transactions/balances` is the ledger's own rollup, which does
 *   capture internal transfers, but can just as easily miss funds added
 *   outside any recorded transaction row (the testnet faucet is a raw
 *   Friendbot call, not something that creates one).
 *
 * These are two views of the *same* real balance, not additive deltas, so
 * taking the higher of the two per currency is what actually covers both
 * cases: the higher figure is never wrong, only the lower one risks being
 * stale relative to whichever source hasn't caught up yet.
 *
 * Reshaped into the same "primary + local" `WalletBalanceSummary` shape
 * every consumer (`BalanceCard`, `WalletBalanceCard`, the Send/Fund/Pay
 * success + validation steps) already expects. No separate branch for "no
 * wallet yet" — same as `WalletBalanceCard`, that's a real `0.00`, not an
 * error, and a failed/erroring source just contributes `0` rather than
 * blocking the other one from showing.
 */
function useWalletBalance() {
	const axiosAuth = useAxiosAuth();
	const { data: wallet, isLoading: isLoadingWallet } = useMyWallet();

	const { data: ledgerBalances, isLoading: isLoadingLedger } = useQuery({
		queryKey: ["dashboard", "balance", "ledger"],
		queryFn: async (): Promise<BalanceData[]> => {
			const { data } = await axiosAuth.get<ApiSuccessResponse<BalanceData[]>>(
				apiRoutes.transactions.BALANCES,
			);
			return data.data;
		},
		// Same reasoning as `useMyWallet`'s own note — money arriving from
		// outside this app has no in-app mutation to invalidate this on
		// success, so it only ever catches up by asking again.
		staleTime: 0,
		refetchInterval: 30_000,
	});

	if (isLoadingWallet || isLoadingLedger) return { data: undefined, isLoading: true };

	const data: WalletBalanceSummary = {
		amount: Math.max(
			findWalletAmount(wallet?.balances, "USDC"),
			findLedgerAmount(ledgerBalances, "USDC"),
		),
		currency: "USDC",
		localAmount: Math.max(
			findWalletAmount(wallet?.balances, "GHS"),
			findLedgerAmount(ledgerBalances, "GHS"),
		),
		localCurrency: "GHS",
	};

	return { data, isLoading: false };
}

/** The dashboard's abbreviated "Recent Transactions" — the same real
 * `GET /transactions` `TransactionHistoryList` uses, just the first page at
 * a small page size and no filters. Scoped server-side by account type
 * already (individual's own personal history vs. a merchant's consolidated
 * feed), so this needs no branching of its own.
 *
 * Same `staleTime: 0` + 30s `refetchInterval` as `useTransactions`/
 * `useMyWallet` — a transaction can land here from entirely outside this
 * app, so nothing of ours ever invalidates this cache on its own. */
function useRecentTransactions(limit = 4) {
	const axiosAuth = useAxiosAuth();

	return useQuery({
		queryKey: ["dashboard", "recent-transactions", limit],
		queryFn: async (): Promise<TransactionData[]> => {
			const { data } = await axiosAuth.get<ApiSuccessResponse<TransactionData[]>>(
				apiRoutes.transactions.LIST,
				{ params: { page: 1, limit } },
			);
			return data.data;
		},
		staleTime: 0,
		refetchInterval: 30_000,
	});
}

export { useWalletBalance, useRecentTransactions };
export type { WalletBalanceSummary };
