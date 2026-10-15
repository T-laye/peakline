import { Stepper } from "@repo/ui/stepper";
import { MobileStepHeader } from "@/features/wallet/components/MobileStepHeader";

const STEPS = ["Your Wallet", "Transaction"];

/** Title + stepper for the two input steps of the external-wallet flow —
 * same mobile/desktop split as `SendStepHeader`. Verifying/result screens
 * don't use it, same as the PIN flow's processing/success screens. */
function ExternalPayStepHeader({ step, onBack }: { step: 1 | 2; onBack: () => void }) {
	return (
		<div className="flex flex-col gap-6">
			<MobileStepHeader title="Pay with external wallet" onBack={onBack} />

			<div className="hidden flex-col gap-1 lg:flex">
				<h1 className="text-h4 text-foreground">Pay with external wallet</h1>
				<p className="text-b3 text-muted-foreground">
					Pay this link from a Stellar wallet outside Peakline.
				</p>
			</div>

			<Stepper steps={STEPS} currentStep={step} />
		</div>
	);
}

export { ExternalPayStepHeader };
