"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Store, User } from "lucide-react";
import { Button } from "@repo/ui/button";
import { Form, FormField, FormItem, FormControl, FormMessage } from "@repo/ui/form";
import { cn } from "@repo/ui/lib/utils";
import {
	accountTypeSchema,
	type AccountTypeValues,
} from "@/lib/validations/authValidations";
import { useSubmitAccountType } from "@/features/auth/hooks";

const ACCOUNT_TYPES = [
	{
		value: "personal",
		icon: User,
		title: "Individual",
		description: "Send, receive and pay with your Peakline wallet.",
	},
	{
		value: "merchant",
		icon: Store,
		title: "Merchant",
		description: "Accept payments and manage your business transactions.",
	},
] as const;

/**
 * Third step of Sign Up, right after email verification — both account
 * types start at Personal Information next; Business Information (merchant
 * only) comes after it, not before:
 *   Sign Up -> Verify -> Account Type -> Personal Details ->
 *   [Business Information, merchant only] -> Review -> Wallet Created.
 * There's no separate merchant app to route into after that — merchant is a
 * permission, not a destination (see CLAUDE.md's Monorepo layout); every
 * account lands in this same `apps/web`, just with merchant-only nav/routes
 * unlocked by the `customerType` this step sets for real via
 * `useSubmitAccountType`'s `PATCH /auth/customer-type` call.
 */
function AccountTypeForm() {
	const form = useForm<AccountTypeValues>({
		resolver: zodResolver(accountTypeSchema),
		defaultValues: { accountType: undefined },
	});
	const submitAccountType = useSubmitAccountType();

	function onSubmit(values: AccountTypeValues) {
		submitAccountType.mutate(values);
	}

	return (
		<div className="flex flex-col gap-8">
			<div className="flex flex-col gap-2">
				<h1 className="text-h4 sm:text-h3 text-foreground">
					How will you use Peakline?
				</h1>
				<p className="text-sm sm:text-b1 text-muted-foreground sm:w-3/4">
					Join Peakline and start sending, receiving and paying securely.
				</p>
			</div>

			<Form {...form}>
				<form
					noValidate
					onSubmit={form.handleSubmit(onSubmit)}
					className="flex flex-col gap-5"
				>
					<FormField
						control={form.control}
						name="accountType"
						render={({ field }) => (
							<FormItem>
								<FormControl>
									<div
										role="radiogroup"
										aria-label="Account type"
										className="flex flex-col gap-4"
									>
										{ACCOUNT_TYPES.map(
											({ value, icon: Icon, title, description }) => {
												const selected = field.value === value;
												return (
													<button
														key={value}
														type="button"
														role="radio"
														aria-checked={selected}
														onClick={() => field.onChange(value)}
														className={cn(
															"flex w-full items-center gap-5 rounded-xl border border-border p-5 text-left transition-colors sm:gap-6 sm:p-6",
															"hover:border-primary-300",
															"focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-200",
															selected && "border-primary-500 bg-accent",
														)}
													>
														<span className="flex size-14 shrink-0 items-center justify-center rounded-md bg-primary-500/10 sm:size-16">
															<Icon
																className="size-6 text-primary-500 sm:size-7"
																aria-hidden="true"
															/>
														</span>
														<span className="flex flex-col gap-1">
															<span className="text-s1 text-foreground">
																{title}
															</span>
															<span className="text-b3 text-muted-foreground">
																{description}
															</span>
														</span>
													</button>
												);
											},
										)}
									</div>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>

					<Button
						type="submit"
						size="large"
						className="w-full"
						loading={submitAccountType.isPending}
					>
						Continue
					</Button>
				</form>
			</Form>
		</div>
	);
}

export { AccountTypeForm };
