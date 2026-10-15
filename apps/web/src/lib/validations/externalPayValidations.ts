import { z } from "zod";
import { WALLET_ADDRESS_REGEX } from "@/lib/wallet";

/** A Stellar transaction hash — 32 bytes, hex-encoded (64 chars). */
export const STELLAR_TX_HASH_REGEX = /^[a-f0-9]{64}$/;

/** Factory rather than a plain schema — the payer's own wallet can't be the
 * link's destination wallet, and only the page knows which link that is. */
export function buildExternalWalletSchema(destinationAddress: string) {
	return z.object({
		senderAddress: z
			.string()
			.trim()
			.min(1, "Enter your wallet address")
			.regex(WALLET_ADDRESS_REGEX, "Enter a valid Stellar wallet address")
			.refine((value) => value !== destinationAddress, {
				message: "This is the merchant's address — enter the wallet you're paying from",
			}),
	});
}
export type ExternalWalletValues = z.infer<ReturnType<typeof buildExternalWalletSchema>>;

export const externalTxHashSchema = z.object({
	// Lowercased before the format check — explorers and wallets show the
	// same hash in either case.
	txHash: z
		.string()
		.trim()
		.toLowerCase()
		.min(1, "Enter the transaction hash")
		.regex(STELLAR_TX_HASH_REGEX, "A transaction hash is 64 characters (0-9, a-f)"),
});
export type ExternalTxHashValues = z.infer<typeof externalTxHashSchema>;
