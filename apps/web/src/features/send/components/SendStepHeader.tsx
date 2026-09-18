import { Stepper } from "@repo/ui/stepper";
import { MobileStepHeader } from "@/features/wallet/components/MobileStepHeader";

const STEPS = ["Transfer Details", "Review"];

/**
 * Title + stepper for both Send steps. Unlike the wallet-domain flows (Fund
 * Wallet: mobile-only `MobileStepHeader` + a separate desktop modal), Send
 * is a single full page at every breakpoint per the mock — no modal variant
 * — but it still needs mobile's back-arrow treatment (reached by drilling
 * in from the Transactions hub/Quick Actions, same as Request Payment, not
 * a primary bottom-tab destination), hence `MobileStepHeader` + its own
 * `lg:hidden`/`hidden lg:flex` desktop counterpart, same split every other
 * dashboard page uses. `onBack` is left to each step's own page, same as
 * Pay/Wallet Fund's confirm steps — step 1 goes wherever it was launched
 * from, step 2 goes back to step 1 specifically, not just browser history.
 */
function SendStepHeader({
	step,
	onBack,
}: {
	step: 1 | 2;
	onBack: () => void;
}) {
	return (
		<div className="flex flex-col gap-6">
			<MobileStepHeader title="Send" onBack={onBack} />

			<div className="hidden flex-col gap-1 lg:flex">
				<h1 className="text-h4 text-foreground">Send</h1>
				<p className="text-b3 text-muted-foreground">Send money</p>
			</div>

			<Stepper steps={STEPS} currentStep={step} />
		</div>
	);
}

export { SendStepHeader };
