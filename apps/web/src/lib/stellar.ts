/** Testnet only — matches this app's own Stellar network throughout
 * (confirmed via CLAUDE.md: "Stellar testnet" for the MVP). Revisit if/when
 * a mainnet deployment exists. No existing helper for this anywhere in the
 * app yet, despite several mocks calling for a "View on Stellar Explorer"
 * link (Transaction/Payment/Reconciliation details) — this is the first. */
function stellarExplorerUrl(txHash: string) {
	return `https://stellar.expert/explorer/testnet/tx/${txHash}`;
}

export { stellarExplorerUrl };
