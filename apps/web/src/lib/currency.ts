/** GHS-per-USDC — matches the dashboard's own seed balance (1,200 USDC ≈
 * GHS 1,245.00 → 1245/1200). Centralized here so every place that shows a
 * local-currency estimate stays consistent with the balance card. */
const GHS_PER_USDC = 1.0375;

function formatUsdc(amount: number) {
	return amount.toLocaleString(undefined, {
		minimumFractionDigits: 2,
		maximumFractionDigits: 2,
	});
}

function usdcToGhs(amount: number) {
	return amount * GHS_PER_USDC;
}

export { GHS_PER_USDC, formatUsdc, usdcToGhs };
