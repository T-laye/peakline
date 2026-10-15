"use client";

import { ShieldCheck } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Alert } from "@repo/ui/alert";
import { Button } from "@repo/ui/button";
import { Input } from "@repo/ui/input";
import {
	Form,
	FormField,
	FormItem,
	FormLabel,
	FormControl,
	FormMessage,
} from "@repo/ui/form";
import { CopyableDetailRow } from "@/features/pay/components/CopyableDetailRow";
import { PayingSummary } from "@/features/pay/components/PayingSummary";
import { formatUsdc } from "@/lib/currency";
import { truncateMiddle } from "@/lib/pay";
import {
	externalTxHashSchema,
	type ExternalTxHashValues,
} from "@/lib/validations/externalPayValidations";
import type { PublicPaymentLinkData } from "@/lib/api/types";

interface ExternalTransactionStepProps {
	link: PublicPaymentLinkData;
	senderAddress: string;
	defaultTxHash?: string | null;
	onChangeWallet: () => void;
	onVerify: (txHash: string) => void;
}

/**
 * Step 2: exactly what to send (copyable, since it gets retyped into
 * another app), then the resulting transaction hash. Desktop puts the
 * instructions and the hash form side by side; mobile stacks them in the
 * order the payer actually does things: send first, then paste the hash.
 */
function ExternalTransactionStep({
	link,
	senderAddress,
	defaultTxHash,
	onChangeWallet,
	onVerify,
}: ExternalTransactionStepProps) {
	const form = useForm<ExternalTxHashValues>({
		resolver: zodResolver(externalTxHashSchema),
		defaultValues: { txHash: defaultTxHash ?? "" },
	});
	const amount = formatUsdc(Number(link.amount));

	return (
		<div className="flex flex-col gap-4 lg:gap-6">
			<PayingSummary link={link} />

			<div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-6">
				<div className="flex flex-col gap-5 rounded-2xl border border-border bg-background p-6 sm:p-8">
					<div className="flex flex-col gap-1">
						<h2 className="text-b2 font-semibold text-foreground sm:text-b1">
							1. Send the payment
						</h2>
						<p className="text-c1 text-muted-foreground sm:text-b3">
							From your external wallet, send exactly these details on the Stellar
							network.
						</p>
					</div>

					<div className="flex flex-col gap-4 rounded-xl border border-secondary-300 bg-secondary-100 p-4 sm:p-5">
						<CopyableDetailRow
							label="Amount"
							value={`${amount} ${link.currency}`}
							copyValue={link.amount}
						/>
						<CopyableDetailRow
							label="Send to"
							value={link.destinationAddress}
							breakAll
						/>
						<CopyableDetailRow label="Memo" value={link.memo} breakAll />
						<div className="flex flex-col gap-0.5">
							<span className="text-c1 text-muted-foreground sm:text-b4">Network</span>
							<span className="text-b4 font-semibold text-foreground sm:text-b3">
								Stellar (testnet) · USDC
							</span>
						</div>
					</div>

					<Alert variant="warning">
						Include the memo and send the exact amount. If anything doesn&apos;t match,
						your payment will need to be reconciled by hand before it&apos;s confirmed.
					</Alert>
				</div>

				<div className="flex flex-col gap-5 rounded-2xl border border-border bg-background p-6 sm:p-8">
					<div className="flex flex-col gap-1">
						<h2 className="text-b2 font-semibold text-foreground sm:text-b1">
							2. Confirm your transaction
						</h2>
						<p className="text-c1 text-muted-foreground sm:text-b3">
							Once it&apos;s sent, paste the transaction hash from your wallet&apos;s
							history so we can verify it.
						</p>
					</div>

					<div className="flex items-center justify-between gap-4 rounded-xl border border-border p-4">
						<div className="flex min-w-0 flex-col gap-0.5">
							<span className="text-c1 text-muted-foreground sm:text-b4">
								Paying from
							</span>
							<span className="truncate text-b4 font-semibold text-foreground sm:text-b3">
								{truncateMiddle(senderAddress, 8, 8)}
							</span>
						</div>
						<button
							type="button"
							onClick={onChangeWallet}
							className="shrink-0 text-b4 font-medium text-primary-600 hover:underline"
						>
							Change
						</button>
					</div>

					<Form {...form}>
						<form
							noValidate
							onSubmit={form.handleSubmit((values) => onVerify(values.txHash))}
							className="flex flex-col gap-5"
						>
							<FormField
								control={form.control}
								name="txHash"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Transaction hash</FormLabel>
										<FormControl>
											<Input
												placeholder="e.g. 3389e9f0f1a65f19..."
												autoComplete="off"
												autoCapitalize="none"
												spellCheck={false}
												{...field}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>

							<Button type="submit" size="large" className="w-full">
								<ShieldCheck className="size-4" aria-hidden="true" />
								Verify Payment
							</Button>
						</form>
					</Form>
				</div>
			</div>
		</div>
	);
}

export { ExternalTransactionStep };
