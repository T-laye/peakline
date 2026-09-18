/**
 * Desktop-only H1 + subtitle header for primary content pages (Receive,
 * Transactions, Profile) — mobile uses `MobileStepHeader`'s back-arrow +
 * centered-title treatment instead, per the mocks (both render side by
 * side in a page, each hiding itself at the other breakpoint via Tailwind,
 * same trick as `WalletBalanceCard`'s dual Add-Money buttons). The two
 * don't share one component since their shapes genuinely differ — a
 * subtitle vs. an optional back arrow — not just their breakpoint.
 *
 * `action` is an optional slot for a page-level button that belongs beside
 * the title (e.g. Payment Links' "+ Create Payment Link") — desktop-only
 * too, same as the title itself; a mobile equivalent (if the page needs
 * one at all) is the page's own concern, not this component's.
 */
function PageHeader({
	title,
	subtitle,
	action,
}: {
	title: string;
	subtitle: string;
	action?: React.ReactNode;
}) {
	return (
		<div className="hidden items-start justify-between gap-4 lg:flex">
			<div className="flex flex-col gap-1">
				<h1 className="text-h4 text-foreground">{title}</h1>
				<p className="text-b3 text-muted-foreground">{subtitle}</p>
			</div>
			{action}
		</div>
	);
}

export { PageHeader };
