"use client";

import { useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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
import { PayingSummary } from "@/features/pay/components/PayingSummary";
import {
	buildExternalWalletSchema,
	type ExternalWalletValues,
} from "@/lib/validations/externalPayValidations";
import type { PublicPaymentLinkData } from "@/lib/api/types";

interface ExternalWalletAddressStepProps {
	link: PublicPaymentLinkData;
	defaultAddress?: string | null;
	onContinue: (senderAddress: string) => void;
}

/** Step 1: the payer's own external Stellar wallet. This is the address
 * the payment will come *from*, so verification can match the on-chain
 * transaction's source, not just its amount and destination. */
function ExternalWalletAddressStep({
	link,
	defaultAddress,
	onContinue,
}: ExternalWalletAddressStepProps) {
	const schema = useMemo(
		() => buildExternalWalletSchema(link.destinationAddress),
		[link.destinationAddress],
	);
	const form = useForm<ExternalWalletValues>({
		resolver: zodResolver(schema),
		defaultValues: { senderAddress: defaultAddress ?? "" },
	});

	return (
		<div className="flex flex-col gap-4 lg:gap-6">
			<PayingSummary link={link} />

			<div className="flex flex-col gap-6 rounded-2xl border border-border bg-background p-6 sm:p-8">
				<div className="flex flex-col gap-1">
					<h2 className="text-b2 font-semibold text-foreground sm:text-b1">
						Which wallet are you paying from?
					</h2>
					<p className="text-c1 text-muted-foreground sm:text-b3">
						Enter the public address of the Stellar wallet you&apos;ll send the USDC from.
						We use it to match your payment to this link.
					</p>
				</div>

				<Form {...form}>
					<form
						noValidate
						onSubmit={form.handleSubmit((values) => onContinue(values.senderAddress))}
						className="flex flex-col gap-5"
					>
						<FormField
							control={form.control}
							name="senderAddress"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Your wallet address</FormLabel>
									<FormControl>
										<Input
											placeholder="G..."
											autoComplete="off"
											autoCapitalize="characters"
											spellCheck={false}
											{...field}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<Button type="submit" size="large" className="w-full">
							Continue
						</Button>
					</form>
				</Form>
			</div>
		</div>
	);
}

export { ExternalWalletAddressStep };
