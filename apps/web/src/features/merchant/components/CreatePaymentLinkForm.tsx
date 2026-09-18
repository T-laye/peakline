"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Building2 } from "lucide-react";
import { Button } from "@repo/ui/button";
import { Input } from "@repo/ui/input";
import { EmptyState } from "@repo/ui/empty-state";
import {
	Form,
	FormField,
	FormItem,
	FormLabel,
	FormControl,
	FormMessage,
} from "@repo/ui/form";
import Link from "next/link";
import {
	createPaymentLinkSchema,
	type CreatePaymentLinkValues,
} from "@/lib/validations/paymentLinksValidations";
import { useCreatePaymentLink } from "@/features/merchant/hooks";
import { useMyBusiness } from "@/features/business/hooks";
import { formatUsdc, usdcToGhs } from "@/lib/currency";
import { getApiErrorMessage } from "@/lib/api/errorMessage";
import { toast } from "@repo/ui/sonner";

interface CreatePaymentLinkFormProps {
	onCreated: (link: string) => void;
}

/**
 * Merchant's own payment-collection form — a title, amount, optional
 * description/reference, and a required Expiration Date (individuals have
 * no equivalent of this at all; only a business can create a payment
 * link). The mock's own screen showed "Description (optional)" twice in a
 * row — kept to one field, since a form asking the same optional question
 * twice reads as a mock duplication bug, not a deliberate design.
 */
function CreatePaymentLinkForm({ onCreated }: CreatePaymentLinkFormProps) {
	const { data: business, isLoading: isLoadingBusiness } = useMyBusiness();
	const createLink = useCreatePaymentLink();
	const form = useForm<CreatePaymentLinkValues>({
		resolver: zodResolver(createPaymentLinkSchema),
		defaultValues: {
			title: "",
			amount: "" as unknown as number,
			description: "",
			expiration: "",
			reference: "",
		},
	});
	const amount = Number(form.watch("amount"));
	const amountValid = amount > 0 && !form.formState.errors.amount;

	function handleSubmit(values: CreatePaymentLinkValues) {
		createLink.mutate(values, {
			onSuccess: (result) => onCreated(result.url),
			onError: (error) =>
				toast.error(getApiErrorMessage(error, "Couldn't create payment link")),
		});
	}

	// A payment link belongs to a business, and there's no way to name one at
	// creation time — same underlying gap `BusinessInformationCard`'s own
	// empty state fixed for Account, surfaced here since it blocks this form
	// specifically.
	if (!isLoadingBusiness && !business) {
		return (
			<div className="rounded-2xl border border-border bg-background">
				<EmptyState
					icon={Building2}
					title="No business yet"
					description="Add your business information before creating a payment link."
					action={
						<Button asChild size="large">
							<Link href="/account">Go to Account</Link>
						</Button>
					}
				/>
			</div>
		);
	}

	return (
		<Form {...form}>
			<form
				noValidate
				onSubmit={form.handleSubmit(handleSubmit)}
				className="flex flex-col gap-5"
			>
				<FormField
					control={form.control}
					name="title"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Payment Title</FormLabel>
							<FormControl>
								<Input placeholder="Enter title" {...field} />
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>

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

				<FormField
					control={form.control}
					name="description"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Description (optional)</FormLabel>
							<FormControl>
								<Input placeholder="Add note" {...field} />
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>

				<FormField
					control={form.control}
					name="expiration"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Expiration Date</FormLabel>
							<FormControl>
								<Input type="date" {...field} />
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>

				<FormField
					control={form.control}
					name="reference"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Customer reference (optional)</FormLabel>
							<FormControl>
								<Input placeholder="e.g INV-001" {...field} />
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>

				<Button type="submit" size="large" className="w-full" loading={createLink.isPending}>
					Create Link
				</Button>
			</form>
		</Form>
	);
}

export { CreatePaymentLinkForm };
