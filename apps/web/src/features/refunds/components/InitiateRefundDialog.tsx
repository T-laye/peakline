"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Check, Loader2, X } from "lucide-react";
import { Alert } from "@repo/ui/alert";
import { Button } from "@repo/ui/button";
import { Input } from "@repo/ui/input";
import { OtpInput } from "@repo/ui/otp-input";
import { Select } from "@repo/ui/select";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@repo/ui/form";
import {
	ResponsiveDialog,
	ResponsiveDialogContent,
	ResponsiveDialogDescription,
	ResponsiveDialogHeader,
	ResponsiveDialogTitle,
} from "@repo/ui/responsive-dialog";
import { useWalletBalance } from "@/features/dashboard/hooks";
import { useCreateRefund } from "@/features/refunds/hooks";
import { createRefundSchema, type CreateRefundValues } from "@/lib/validations/refundValidations";
import { formatUsdc, usdcToGhs } from "@/lib/currency";
import { getApiErrorMessage } from "@/lib/api/errorMessage";
import type { RefundablePaymentData, RefundData } from "@/lib/api/types";
import { maskWallet } from "./parts";

const PIN_LENGTH = 6;

type Step = "form" | "authorize" | "processing" | "success" | "failed";

function SummaryRow({ label, value }: { label: string; value: React.ReactNode }) {
	return (
		<div className="flex items-start justify-between gap-4 text-c1 sm:text-b3">
			<span className="shrink-0 text-muted-foreground">{label}</span>
			<span className="min-w-0 text-right font-semibold break-words text-foreground">{value}</span>
		</div>
	);
}

function AmountSuffix() {
	return (
		<div className="flex h-11 w-24 shrink-0 items-center justify-center rounded-lg border border-input bg-muted text-b1 text-foreground">
			USDC
		</div>
	);
}

interface InitiateRefundDialogProps {
	payment: RefundablePaymentData;
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

/**
 * c5 + c6 — one dialog walking Requested → Authorized → Processing →
 * Completed/Failed:
 * 1. form (c5): Full fixes the amount to the remaining refundable balance;
 *    Partial makes it editable and shows that balance read-only.
 * 2. authorize: transaction PIN — the brief requires explicit merchant
 *    authorization before execution (no mock for this step; same OtpInput
 *    the Send flow's PIN dialog uses).
 * 3. processing, then success (c6) or failed.
 * One idempotency key per opened dialog, so a double-click or retry can't
 * pay out twice.
 */
function InitiateRefundDialog({ payment, open, onOpenChange }: InitiateRefundDialogProps) {
	const router = useRouter();
	const remaining = Number(payment.remainingRefundable);
	const [step, setStep] = useState<Step>("form");
	const [pin, setPin] = useState("");
	const [idempotencyKey, setIdempotencyKey] = useState(() => crypto.randomUUID());
	const [result, setResult] = useState<RefundData | null>(null);
	const [error, setError] = useState<string | null>(null);
	const createRefund = useCreateRefund();
	const { data: balance } = useWalletBalance();

	const form = useForm<CreateRefundValues>({
		resolver: zodResolver(createRefundSchema(remaining)),
		defaultValues: { type: "full", amount: remaining, reason: "" },
	});
	const type = form.watch("type");
	const amount = Number(form.watch("amount")) || 0;
	const reason = form.watch("reason");

	function handleOpenChange(next: boolean) {
		// Don't let the dialog close mid-submission — the outcome must be seen.
		if (!next && step === "processing") return;
		onOpenChange(next);
		if (!next) {
			setStep("form");
			setPin("");
			setError(null);
			setResult(null);
			setIdempotencyKey(crypto.randomUUID());
			form.reset({ type: "full", amount: Number(payment.remainingRefundable), reason: "" });
		}
	}

	function handleTypeChange(value: "full" | "partial") {
		form.setValue("type", value);
		form.setValue("amount", value === "full" ? remaining : ("" as unknown as number));
		form.clearErrors("amount");
	}

	function handleAuthorize() {
		if (pin.length !== PIN_LENGTH) return;
		const values = form.getValues();
		setStep("processing");
		createRefund.mutate(
			{
				paymentId: payment.id,
				type: values.type,
				amount: Number(values.amount),
				reason: values.reason.trim(),
				pin,
				idempotencyKey,
			},
			{
				onSuccess: (refund) => {
					setResult(refund);
					setStep("success");
				},
				onError: (err) => {
					setError(getApiErrorMessage(err, "The refund couldn't be completed."));
					setStep("failed");
				},
			},
		);
	}

	const isSummaryStep = step === "form" || step === "authorize";

	return (
		<ResponsiveDialog open={open} onOpenChange={handleOpenChange}>
			<ResponsiveDialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-xl">
				{isSummaryStep && (
					<ResponsiveDialogHeader>
						<ResponsiveDialogTitle>
							{step === "form" ? "Initiate refund" : "Authorize refund"}
						</ResponsiveDialogTitle>
						<ResponsiveDialogDescription>
							{step === "form"
								? "Initiate a refund to customers."
								: `Enter your transaction PIN to send ${formatUsdc(amount)} USDC to the customer's wallet.`}
						</ResponsiveDialogDescription>
					</ResponsiveDialogHeader>
				)}

				{step === "form" && (
					<Form {...form}>
						<form noValidate onSubmit={form.handleSubmit(() => setStep("authorize"))} className="flex flex-col gap-5">
							<FormField
								control={form.control}
								name="type"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Refund type</FormLabel>
										<FormControl>
											<Select
												name={field.name}
												ref={field.ref}
												value={field.value}
												onBlur={field.onBlur}
												onChange={(e) => handleTypeChange(e.target.value as "full" | "partial")}
											>
												<option value="full">Full</option>
												<option value="partial">Partial</option>
											</Select>
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
										<FormLabel>Refund Amount</FormLabel>
										<div className="flex gap-3">
											<FormControl>
												<Input
													type="number"
													inputMode="decimal"
													min={0}
													step="any"
													placeholder="0"
													readOnly={type === "full"}
													{...field}
												/>
											</FormControl>
											<AmountSuffix />
										</div>
										{amount > 0 && (
											<p className="text-c1 text-muted-foreground">~ GHS {formatUsdc(usdcToGhs(amount))}</p>
										)}
										<FormMessage />
									</FormItem>
								)}
							/>

							{type === "partial" && (
								<div className="flex flex-col gap-2">
									<span className="text-label text-foreground">Remaining refundable balance</span>
									<div className="flex gap-3">
										<Input value={formatUsdc(remaining)} readOnly aria-label="Remaining refundable balance" />
										<AmountSuffix />
									</div>
									<p className="text-c1 text-muted-foreground">~ GHS {formatUsdc(usdcToGhs(remaining))}</p>
								</div>
							)}

							<FormField
								control={form.control}
								name="reason"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Refund reason</FormLabel>
										<FormControl>
											<Input placeholder="Add note" {...field} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>

							<SummaryRow label="Customer's original payment wallet" value={maskWallet(payment.customerWallet)} />

							<RefundSummary type={type} amount={amount} reason={reason} />

							<Button type="submit" size="large" className="w-full">
								Confirm
							</Button>
						</form>
					</Form>
				)}

				{step === "authorize" && (
					<div className="flex flex-col gap-5">
						<RefundSummary type={type} amount={amount} reason={reason} />
						<OtpInput value={pin} onChange={setPin} length={PIN_LENGTH} />
						<div className="flex flex-col gap-3 sm:flex-row-reverse">
							<Button
								type="button"
								size="large"
								className="w-full"
								disabled={pin.length !== PIN_LENGTH || createRefund.isPending}
								onClick={handleAuthorize}
							>
								Authorize refund
							</Button>
							<Button type="button" size="large" variant="outline" className="w-full" onClick={() => setStep("form")}>
								Back
							</Button>
						</div>
					</div>
				)}

				{step === "processing" && (
					<div className="flex flex-col items-center gap-4 py-10 text-center">
						<ResponsiveDialogTitle className="sr-only">Processing refund</ResponsiveDialogTitle>
						<Loader2 className="size-12 animate-spin text-primary-600" aria-hidden="true" />
						<p className="text-s1 text-foreground">Processing refund…</p>
						<p className="text-b3 text-muted-foreground">
							Submitting to Stellar and waiting for confirmation. Don&apos;t close this window.
						</p>
					</div>
				)}

				{step === "success" && result && (
					<div className="flex flex-col items-center gap-6 py-2 text-center">
						<ResponsiveDialogTitle className="sr-only">Refund successful</ResponsiveDialogTitle>
						<span className="flex size-16 items-center justify-center rounded-full bg-primary-500 sm:size-20">
							<Check className="size-7 text-primary-foreground sm:size-9" strokeWidth={3} aria-hidden="true" />
						</span>
						<div className="flex flex-col gap-2">
							<h2 className="text-s1 text-foreground sm:text-h5">Refund Successful!</h2>
							<p className="text-b4 text-muted-foreground sm:text-b3">
								The refund was sent directly to the customer&apos;s wallet.
							</p>
							<p className="text-h5 text-foreground sm:text-h4">{formatUsdc(Number(result.amount))} USDC</p>
							<p className="text-b4 text-muted-foreground sm:text-b3">
								~ GHS {formatUsdc(usdcToGhs(Number(result.amount)))}
							</p>
						</div>
						<div className="flex w-full flex-col gap-1 text-left">
							<span className="text-c1 text-muted-foreground sm:text-b3">To</span>
							<span className="text-b3 text-foreground">Customer&apos;s original payment wallet</span>
							<span className="text-b2 font-semibold break-all text-foreground">
								{maskWallet(result.destinationWallet)}
							</span>
						</div>
						<div className="flex w-full flex-col gap-1 rounded-xl border border-secondary-300 bg-secondary-100 p-4 text-left sm:p-5">
							<span className="text-c1 text-muted-foreground sm:text-b3">New Balance</span>
							<span className="text-h5 text-foreground">
								{balance ? `${formatUsdc(balance.amount)} ${balance.currency}` : "—"}
							</span>
							{balance && (
								<span className="text-c1 text-muted-foreground sm:text-b3">
									~ GHS {formatUsdc(usdcToGhs(balance.amount))}
								</span>
							)}
						</div>
						<div className="flex w-full flex-col items-center gap-4">
							<Button type="button" size="large" className="w-full" onClick={() => router.push("/")}>
								Go to Dashboard
							</Button>
							<button
								type="button"
								onClick={() => router.push(`/refunds/${payment.id}/${result.id}`)}
								className="text-b3 font-medium text-foreground hover:underline"
							>
								View Refund details
							</button>
						</div>
					</div>
				)}

				{step === "failed" && (
					<div className="flex flex-col items-center gap-5 py-4 text-center">
						<ResponsiveDialogTitle className="sr-only">Refund failed</ResponsiveDialogTitle>
						<span className="flex size-16 items-center justify-center rounded-full bg-destructive">
							<X className="size-8 text-destructive-foreground" strokeWidth={3} aria-hidden="true" />
						</span>
						<h2 className="text-s1 text-foreground sm:text-h5">Refund not completed</h2>
						{error && <Alert variant="error">{error}</Alert>}
						<p className="text-b3 text-muted-foreground">
							Nothing is counted as refunded unless it&apos;s confirmed on Stellar. Check this
							payment&apos;s refund history before trying again.
						</p>
						<Button type="button" size="large" className="w-full" onClick={() => handleOpenChange(false)}>
							Close
						</Button>
					</div>
				)}
			</ResponsiveDialogContent>
		</ResponsiveDialog>
	);
}

function RefundSummary({ type, amount, reason }: { type: "full" | "partial"; amount: number; reason: string }) {
	return (
		<div className="flex flex-col gap-4 rounded-xl border border-secondary-300 bg-secondary-100 p-4 sm:p-5">
			<span className="text-b3 text-muted-foreground">Summary</span>
			<SummaryRow label="Refund type" value={type === "full" ? "Full" : "Partial"} />
			<SummaryRow label="Refund amount" value={`${formatUsdc(amount)} USDC`} />
			<SummaryRow label="Reason" value={reason.trim() || "—"} />
			<SummaryRow label="Network" value="Stellar Testnet" />
			<SummaryRow label="Est. Fee" value="0.00 USDC" />
			<SummaryRow label="You are refunding" value={`${formatUsdc(amount)} USDC`} />
		</div>
	);
}

export { InitiateRefundDialog };
