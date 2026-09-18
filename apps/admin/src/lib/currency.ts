/** Every admin-overview amount is a decimal string (ledger precision), not
 * a number — this app never converts to GHS (that's a customer-facing
 * concern in apps/web), it just formats USDC totals for display. */
function formatUsdc(amount: string | number) {
	return Number(amount).toLocaleString(undefined, {
		minimumFractionDigits: 2,
		maximumFractionDigits: 2,
	});
}

export { formatUsdc };
