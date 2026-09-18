"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
	Dialog,
	DialogTrigger,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogDescription,
} from "@repo/ui/dialog";
import type { FundWalletValues } from "@/lib/validations/walletValidations";
import type { FundQuoteData, FundWalletResultData } from "@/lib/api/types";
import { FundWalletFormStep } from "./FundWalletFormStep";
import { ConfirmFundingStep } from "./ConfirmFundingStep";
import { FundingProcessingStep } from "./FundingProcessingStep";
import { FundingSuccessStep } from "./FundingSuccessStep";
import { FundingFailedStep } from "./FundingFailedStep";

type Step = "form" | "confirm" | "processing" | "success" | "failed";

/**
 * Desktop modal — mobile gets the equivalent as real pages under
 * /wallet/fund/* instead (see that route group), sharing these same step
 * components so the two surfaces can't drift apart. Five steps in one
 * dialog rather than five dialogs, so there's no close-then-reopen flash
 * between them.
 */
function FundWalletDialog({ children }: { children: React.ReactNode }) {
	const router = useRouter();
	const [open, setOpen] = useState(false);
	const [step, setStep] = useState<Step>("form");
	const [values, setValues] = useState<FundWalletValues | null>(null);
	const [quote, setQuote] = useState<FundQuoteData | null>(null);
	const [result, setResult] = useState<FundWalletResultData | null>(null);
	const [errorMessage, setErrorMessage] = useState<string | null>(null);

	function handleOpenChange(next: boolean) {
		setOpen(next);
		if (!next) {
			// Wait out the close animation before resetting so the content
			// doesn't visibly flip back to step 1 mid-close.
			setTimeout(() => {
				setStep("form");
				setValues(null);
				setQuote(null);
				setResult(null);
				setErrorMessage(null);
			}, 200);
		}
	}

	function handleGoToDashboard() {
		handleOpenChange(false);
		router.push("/");
	}

	function handleViewTransactions() {
		handleOpenChange(false);
		router.push("/transactions");
	}

	// A transaction that's in flight, or has just settled, shouldn't be
	// dismissable by clicking outside/Escape or the X — only success/failed's
	// own buttons, or (for failed) trying again, should move on from here.
	const dismissable = step === "form" || step === "confirm";

	return (
		<Dialog open={open} onOpenChange={dismissable ? handleOpenChange : undefined}>
			<DialogTrigger asChild>{children}</DialogTrigger>
			<DialogContent
				showCloseButton={dismissable}
				onEscapeKeyDown={(e) => !dismissable && e.preventDefault()}
				onPointerDownOutside={(e) => !dismissable && e.preventDefault()}
			>
				{step === "form" && (
					<>
						<DialogHeader>
							<DialogTitle>Fund Wallet</DialogTitle>
							<DialogDescription>
								Add test USDC to your Peakline wallet.
							</DialogDescription>
						</DialogHeader>
						<FundWalletFormStep
							defaultValues={values}
							onContinue={(submitted) => {
								setValues(submitted);
								setStep("confirm");
							}}
						/>
					</>
				)}

				{step === "confirm" && values && (
					<>
						<DialogHeader>
							<DialogTitle>Confirm Funding Details</DialogTitle>
						</DialogHeader>
						<ConfirmFundingStep
							values={values}
							onContinue={(confirmedQuote) => {
								setQuote(confirmedQuote);
								setStep("processing");
							}}
						/>
					</>
				)}

				{step === "processing" && quote && (
					<FundingProcessingStep
						quote={quote}
						onSuccess={(fundResult) => {
							setResult(fundResult);
							setStep("success");
						}}
						onError={(message) => {
							setErrorMessage(message);
							setStep("failed");
						}}
					/>
				)}

				{step === "success" && result && (
					<FundingSuccessStep
						result={result}
						onGoToDashboard={handleGoToDashboard}
						onViewTransactions={handleViewTransactions}
					/>
				)}

				{step === "failed" && values && errorMessage && (
					<FundingFailedStep
						amount={values.amount}
						errorMessage={errorMessage}
						onTryAgain={() => setStep("confirm")}
						onGoToDashboard={handleGoToDashboard}
					/>
				)}
			</DialogContent>
		</Dialog>
	);
}

export { FundWalletDialog };
