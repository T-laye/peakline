"use client";

import { Wallet } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@repo/ui/button";
import { Input } from "@repo/ui/input";
import { Skeleton } from "@repo/ui/skeleton";
import { EmptyState } from "@repo/ui/empty-state";
import {
	Form,
	FormField,
	FormItem,
	FormLabel,
	FormControl,
	FormMessage,
} from "@repo/ui/form";
import { fundWalletSchema, type FundWalletValues } from "@/lib/validations/walletValidations";
import { useMyWallet } from "@/features/wallet/hooks";
import { formatUsdc, usdcToGhs } from "@/lib/currency";

function SummaryRow({ label, value }: { label: string; value: string }) {
	return (
		<div className="flex items-center justify-between gap-4 text-c1 sm:text-b3">
			<span className="text-muted-foreground">{label}</span>
			<span className="font-semibold text-foreground">{value}</span>
		</div>
	);
}

interface FundWalletFormStepProps {
	defaultValues?: FundWalletValues | null;
	onContinue: (values: FundWalletValues) => void;
}

/** Step 1 — an amount only now (no funding-method picker; the real backend
 * has no fiat on-ramp, so the earlier Mobile Money/Bank/Card picker was
 * fake from the start — see `walletValidations.ts`). Shared by the desktop
 * modal and the mobile /wallet/fund page. Gates on `useMyWallet` first —
 * same fallback for every account type now that it's always the account's
 * own `GET /wallets/stellar` (no more merchant-specific "no business" /
 * "no business wallet" prompts; see that hook's own note).
 */
function FundWalletFormStep({ defaultValues, onContinue }: FundWalletFormStepProps) {
	const { data: wallet, isLoading: isLoadingWallet } = useMyWallet();
	const form = useForm<FundWalletValues>({
		resolver: zodResolver(fundWalletSchema),
		defaultValues: {
			amount: (defaultValues?.amount ?? "") as unknown as number,
		},
	});
	const amount = Number(form.watch("amount"));
	const amountValid = amount > 0 && !form.formState.errors.amount;

	if (isLoadingWallet) {
		return (
			<div className="flex flex-col gap-4">
				<Skeleton className="h-11 w-full" />
				<Skeleton className="h-11 w-full" />
			</div>
		);
	}

	if (!wallet) {
		// Shouldn't normally happen — sign-up's own `SetPinForm` already
		// creates the account's wallet — but the type allows it.
		return (
			<EmptyState
				icon={Wallet}
				title="No wallet yet"
				description="Your wallet hasn't been set up yet."
			/>
		);
	}

	return (
		<Form {...form}>
			<form
				noValidate
				onSubmit={form.handleSubmit(onContinue)}
				className="flex flex-col gap-5"
			>
				<FormField
					control={form.control}
					name="amount"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Amount</FormLabel>
							<div className="flex gap-3">
								<FormControl>
									<Input
										type="number"
										inputMode="decimal"
										min={0}
										step="any"
										placeholder="0"
										{...field}
									/>
								</FormControl>
								<div className="flex h-11 w-24 shrink-0 items-center justify-center rounded-lg border border-input bg-muted text-b1 text-foreground">
									USDC
								</div>
							</div>
							{amountValid && (
								<p className="text-c1 text-muted-foreground">
									~ GHS {formatUsdc(usdcToGhs(amount))}
								</p>
							)}
							<FormMessage />
						</FormItem>
					)}
				/>

				{amountValid && (
					<div className="flex flex-col gap-2.5 rounded-xl border border-secondary-300 bg-secondary-100 p-4 sm:gap-3 sm:p-5">
						<span className="text-c1 text-muted-foreground sm:text-b3">Summary</span>
						<SummaryRow label="Amount" value={`${formatUsdc(amount)} USDC`} />
						<SummaryRow label="Network" value="Stellar (testnet)" />
						<SummaryRow label="Source" value="Peakline test faucet" />
					</div>
				)}

				<Button type="submit" size="large" className="w-full">
					Continue
				</Button>
			</form>
		</Form>
	);
}

export { FundWalletFormStep };
