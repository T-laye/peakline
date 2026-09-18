"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Search, X } from "lucide-react";
import { isValidPhoneNumber } from "libphonenumber-js/min";
import { Button } from "@repo/ui/button";
import { Input } from "@repo/ui/input";
import { Select } from "@repo/ui/select";
import { PhoneInput } from "@repo/ui/phone-input";
import {
	Form,
	FormField,
	FormItem,
	FormLabel,
	FormControl,
	FormMessage,
} from "@repo/ui/form";
import {
	sendMoneySchema,
	TRANSFER_METHODS,
	type SendMoneyValues,
} from "@/lib/validations/sendValidations";
import { useWalletBalance } from "@/features/dashboard/hooks";
import { useWalletSearch } from "@/features/wallet/hooks";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { ResolvedRecipientCard } from "@/features/send/components/ResolvedRecipientCard";
import { splitPhoneForSearch } from "@/lib/phone";
import { formatUsdc, usdcToGhs } from "@/lib/currency";
import type { WalletSearchResultData } from "@/lib/api/types";

const RECIPIENT_FIELD: Record<
	SendMoneyValues["method"],
	{ label: string; placeholder: string }
> = {
	phone: { label: "Recipient Phone Number", placeholder: "" },
	username: { label: "Recipient Username", placeholder: "Enter username" },
	wallet: {
		label: "Recipient Wallet Address",
		placeholder: "Enter wallet address",
	},
};

interface SendMoneyFormStepProps {
	defaultValues?: SendMoneyValues | null;
	onContinue: (values: SendMoneyValues) => void;
}

/**
 * Step 1 — transfer method + the single matching recipient field, amount,
 * and an optional note. The reference mock's screenshot shows all three
 * recipient fields (Phone/Username/Wallet Address) stacked at once, which
 * reads as its unselected "kitchen sink" reference state rather than actual
 * runtime behavior — showing only the field for the chosen method is both
 * cleaner and avoids validating two empty fields no one is filling in.
 *
 * Two ways this verifies who's actually being paid before the transfer
 * fires, both backed by the real `GET /wallets/search` (`useWalletSearch`)
 * — reported live as missing, "just like in bank apps": previously a
 * manually-typed identifier just went straight to `POST /transfers/send`
 * with zero confirmation.
 * - Phone: once the typed number is syntactically complete, this searches
 *   for an exact match — Continue stays disabled until one's found (see
 *   `canContinue`), same as a bank app refusing to move forward on an
 *   account number it can't resolve to a name. This is the one method that
 *   actually *can* be verified this way, since it's the one identifier
 *   `GET /wallets/search` accepts directly.
 * - "Find by name" is a separate discovery box, not a fourth transfer
 *   method — `name` was never a valid `SendMoneyDto.mode`. Picking a
 *   result switches the form to a normal `wallet`-mode entry under the
 *   hood (`method`/`recipient` set to that person's own address), the
 *   same as a QR/link-resolved recipient — already fully verified by
 *   construction, since it only ever came from a real search result.
 *
 * Username and a manually-typed wallet address have no equivalent
 * verification path — confirmed against a fresh pull of `/docs-json`,
 * there's no endpoint that resolves a username, and a wallet address is
 * deliberately allowed to be any valid Stellar account (an external,
 * non-Peakline wallet is a legitimate `mode: "wallet"` recipient too, per
 * `SendMoneyDto`'s own description), not something "existing as a Peakline
 * user" would even mean. Both stay format-validated only, with an explicit
 * note in the UI saying so rather than silently pretending the same
 * confidence phone verification offers.
 */
function SendMoneyFormStep({ defaultValues, onContinue }: SendMoneyFormStepProps) {
	const { data: balance } = useWalletBalance();
	const [nameSearchOpen, setNameSearchOpen] = useState(false);
	const [nameQuery, setNameQuery] = useState("");
	const [resolvedRecipientName, setResolvedRecipientName] = useState<string | undefined>(
		defaultValues?.recipientName,
	);
	const form = useForm<SendMoneyValues>({
		resolver: zodResolver(sendMoneySchema),
		defaultValues: {
			method: defaultValues?.method ?? (undefined as unknown as SendMoneyValues["method"]),
			recipient: defaultValues?.recipient ?? "",
			amount: (defaultValues?.amount ?? "") as unknown as number,
			note: defaultValues?.note ?? "",
		},
	});
	const method = form.watch("method");
	const recipient = form.watch("recipient");
	const amount = Number(form.watch("amount"));
	const amountValid = amount > 0 && !form.formState.errors.amount;

	// Only enabled once the typed value is a syntactically complete phone
	// number — `useWalletSearch`'s own `enabled` gate would otherwise fire on
	// every partial digit typed.
	const phoneSearchParams =
		method === "phone" && isValidPhoneNumber(recipient || "")
			? splitPhoneForSearch(recipient)
			: null;
	const { data: phoneMatches, isFetching: isVerifyingPhone } = useWalletSearch(
		phoneSearchParams ? { phone: phoneSearchParams } : null,
	);
	const phoneMatch = phoneMatches?.[0] ?? null;
	// Phone is the one method with a real "does this exist" check — blocked
	// until it passes, same as a bank app. Username/wallet have no
	// equivalent endpoint to check against (see this component's own doc
	// comment), so they're never blocked here, only format-validated by
	// `sendMoneySchema` itself.
	const canContinue = method !== "phone" || Boolean(phoneMatch);

	// Debounced — without this, every keystroke while typing a name fired its
	// own `GET /wallets/search` request (react-query has no built-in
	// debounce of its own), which is wasted work for anything but the
	// final, settled query the person actually meant to search for.
	const debouncedNameQuery = useDebouncedValue(nameQuery, 300);
	const { data: nameResults, isFetching: isSearchingName } = useWalletSearch(
		nameSearchOpen ? { name: debouncedNameQuery } : null,
	);

	function handleMethodChange(nextMethod: string) {
		form.setValue("method", nextMethod as SendMoneyValues["method"]);
		// Switching methods invalidates whatever was typed for the previous
		// one, and any name-search/phone-verify confirmation that went with it.
		form.resetField("recipient", { defaultValue: "" });
		setResolvedRecipientName(undefined);
	}

	function handleSelectNameResult(result: WalletSearchResultData) {
		form.setValue("method", "wallet");
		form.setValue("recipient", result.publicKey, { shouldValidate: true });
		setResolvedRecipientName(result.name);
		setNameSearchOpen(false);
		setNameQuery("");
	}

	function handleSubmit(values: SendMoneyValues) {
		if (!canContinue) return;
		if (balance && values.amount > balance.amount) {
			form.setError("amount", { message: "Insufficient balance" });
			return;
		}
		onContinue({
			...values,
			recipientName:
				values.method === "phone" ? (phoneMatch?.name ?? undefined) : resolvedRecipientName,
		});
	}

	return (
		<Form {...form}>
			<form
				noValidate
				onSubmit={form.handleSubmit(handleSubmit)}
				className="flex flex-col gap-5"
			>
				<div className="flex flex-col gap-2">
					<div className="flex items-center justify-between">
						<span className="text-label text-foreground">Find a recipient</span>
						<button
							type="button"
							onClick={() => {
								setNameSearchOpen((open) => !open);
								setNameQuery("");
							}}
							className="text-b4 font-medium text-primary hover:underline"
						>
							{nameSearchOpen ? "Cancel" : "Search by name"}
						</button>
					</div>

					{nameSearchOpen && (
						<div className="flex flex-col gap-2 rounded-xl border border-border p-3">
							<div className="relative">
								<Search
									className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
									aria-hidden="true"
								/>
								<Input
									autoFocus
									value={nameQuery}
									onChange={(e) => setNameQuery(e.target.value)}
									placeholder="Search by name"
									className="pl-9"
								/>
							</div>

							{nameQuery.trim().length >= 2 && (
								<div className="flex flex-col gap-1">
									{isSearchingName ? (
										<p className="p-2 text-c1 text-muted-foreground">Searching…</p>
									) : nameResults && nameResults.length > 0 ? (
										nameResults.map((result) => (
											<button
												key={result.publicKey}
												type="button"
												onClick={() => handleSelectNameResult(result)}
												className="flex items-center justify-between rounded-lg p-2 text-left text-b3 hover:bg-muted"
											>
												{result.name}
											</button>
										))
									) : (
										<p className="p-2 text-c1 text-muted-foreground">No matches found</p>
									)}
								</div>
							)}
						</div>
					)}
				</div>

				{resolvedRecipientName && method === "wallet" && (
					<div className="relative">
						<ResolvedRecipientCard isLoading={false} name={resolvedRecipientName} notFound={false} />
						<button
							type="button"
							aria-label="Clear selected recipient"
							onClick={() => {
								setResolvedRecipientName(undefined);
								form.resetField("recipient", { defaultValue: "" });
							}}
							className="absolute top-3 right-3 text-muted-foreground hover:text-foreground"
						>
							<X className="size-4" aria-hidden="true" />
						</button>
					</div>
				)}

				<FormField
					control={form.control}
					name="method"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Select Transfer Method</FormLabel>
							<FormControl>
								<Select {...field} value={field.value ?? ""} onChange={(e) => handleMethodChange(e.target.value)}>
									<option value="" disabled>
										Phone, username, wallet address
									</option>
									{TRANSFER_METHODS.map((transferMethod) => (
										<option key={transferMethod.value} value={transferMethod.value}>
											{transferMethod.label}
										</option>
									))}
								</Select>
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>

				{method && !(method === "wallet" && resolvedRecipientName) && (
					<FormField
						control={form.control}
						name="recipient"
						render={({ field }) => (
							<FormItem>
								<FormLabel>{RECIPIENT_FIELD[method].label}</FormLabel>
								<FormControl>
									{method === "phone" ? (
										<PhoneInput
											name={field.name}
											value={field.value}
											onChange={field.onChange}
											onBlur={field.onBlur}
										/>
									) : (
										<Input placeholder={RECIPIENT_FIELD[method].placeholder} {...field} />
									)}
								</FormControl>
								{method === "phone" && phoneSearchParams && (
									<p
										className={
											isVerifyingPhone
												? "text-c1 text-muted-foreground"
												: phoneMatch
													? "text-c1 text-success-600"
													: "text-c1 text-destructive"
										}
									>
										{isVerifyingPhone
											? "Checking…"
											: phoneMatch
												? `✓ ${phoneMatch.name}`
												: "No Peakline account found for this number."}
									</p>
								)}
								{(method === "username" || method === "wallet") && (
									<p className="text-c1 text-muted-foreground">
										We can&apos;t confirm who this belongs to before sending — double-check it&apos;s
										correct.
									</p>
								)}
								<FormMessage />
							</FormItem>
						)}
					/>
				)}

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

				{balance && (
					<div className="flex items-center justify-between text-c1 sm:text-b3">
						<span className="text-muted-foreground">Available Balance</span>
						<span className="font-semibold text-foreground">
							{formatUsdc(balance.amount)} {balance.currency}
						</span>
					</div>
				)}

				<FormField
					control={form.control}
					name="note"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Note (optional)</FormLabel>
							<FormControl>
								<Input placeholder="Add note" {...field} />
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>

				<Button type="submit" size="large" className="w-full" disabled={!canContinue}>
					Continue
				</Button>
			</form>
		</Form>
	);
}

export { SendMoneyFormStep };
