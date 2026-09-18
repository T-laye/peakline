import { z } from "zod";

const MIN_FUNDING_AMOUNT = 10;

// No funding-method field — the real backend funds via a testnet faucet
// (see `useFundWallet`), not a fiat on-ramp (Mobile Money/Bank/Card never
// existed as real endpoints; that picker was fake from the start).
export const fundWalletSchema = z.object({
	amount: z.coerce
		.number({ message: "Enter an amount" })
		.positive("Enter an amount greater than 0")
		.min(
			MIN_FUNDING_AMOUNT,
			`Minimum funding amount is ${MIN_FUNDING_AMOUNT} USDC`,
		),
});
export type FundWalletValues = z.infer<typeof fundWalletSchema>;
