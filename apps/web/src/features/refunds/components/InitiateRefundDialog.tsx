"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Check, Loader2, X } from "lucide-react";
import { Alert } from "@repo/ui/alert";
import { Button } from "@repo/ui/button";
import { Input } from "@repo/ui/input";
import { OtpInput } from "@repo/ui/otp-input";
import { Select } from "@repo/ui/select";
import { toast } from "@repo/ui/sonner";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@repo/ui/form";
import {
	ResponsiveDialog,
	ResponsiveDialogContent,
	ResponsiveDialogDescription,
	ResponsiveDialogHeader,
	ResponsiveDialogTitle,
} from "@repo/ui/responsive-dialog";
import { useWalletBalance } from "@/features/dashboard/hooks";
import {
	useAuthorizeRefund,
	useCancelRefund,
	useCreateRefund,
	useExecuteRefund,
	useRefund,
} from "@/features/refunds/hooks";
import { createRefundSchema, type CreateRefundValues } from "@/lib/validations/refundValidations";
import { formatUsdc, usdcToGhs } from "@/lib/currency";
import { describeIssue } from "@/lib/stellarIssues";
import {
	getApiErrorCode,
	getApiErrorIssues,
	getApiErrorMessage,
	getApiErrorStatus,
} from "@/lib/api/errorMessage";
import type { RefundableBalanceData, RefundData } from "@/lib/api/types";
import { maskWallet } from "./parts";

const PIN_LENGTH = 6;

type Step = "form" | "confirm" | "authorized" | "processing" | "success" | "failed";

function SummaryRow({ label, value }: { label: string; value: React.ReactNode }) {
	return (
		<div className="flex items-start justify-between gap-4 text-c1 sm:text-b3">
			<span className="shrink-0 text-muted-foreground">{label}</span>
			<span className="min-w-0 text-right font-semibold wrap-break-word text-foreground">{value}</span>
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

function stepFor(refund: RefundData): Step {
	switch (refund.status) {
		case "requested":
			return "confirm";
		case "authorized":
			return "authorized";
		case "processing":
			return "processing";
		case "completed":
			return "success";
		default:
			return "failed";
	}
}

interface InitiateRefundDialogProps {
	/** The payment's ledger transaction id. */
	paymentId: string;
	/** Original payer address (refunds always go back here). */
	payerAddress: string;
	refundable: RefundableBalanceData;
	/** Resume an existing refund (requested/authorized) instead of starting a new one. */
	existingRefund?: RefundData | null;
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

/**
 * c5 + c6 on the real refund API (frontend-integration.md §4):
 * 1. form (c5) → `POST /refunds` reserves the amount (status requested).
 *    One idempotency key per dialog, so a double submit or retry returns
 *    the same refund instead of creating a second.
 * 2. confirm: recipient + amount from the created refund, then the owner's
 *    transaction PIN → `POST /refunds/:id/authorize`.
 *    - 422 `details.issues`: can't be sent yet, stays requested.
 *    - 422 insufficient balance: becomes `authorized` → retry via /execute.
 * 3. processing → polls `GET /refunds/:id` → success (c6) or failed.
 */
function InitiateRefundDialog({
	paymentId,
	payerAddress,
	refundable,
	existingRefund,
	open,
	onOpenChange,
}: InitiateRefundDialogProps) {
	const router = useRouter();
	const remaining = Number(refundable.remaining);
	const [rawStep, setStep] = useState<Step>(existingRefund ? stepFor(existingRefund) : "form");
	const [refundId, setRefundId] = useState<string | null>(existingRefund?.id ?? null);
	const [pin, setPin] = useState("");
	const [pinError, setPinError] = useState<string | null>(null);
	const [issues, setIssues] = useState<string[]>([]);
	const [error, setError] = useState<string | null>(null);
	const [idempotencyKey] = useState(() => crypto.randomUUID());

	const createRefund = useCreateRefund();
	const authorizeRefund = useAuthorizeRefund();
	const executeRefund = useExecuteRefund();
	const cancelRefund = useCancelRefund();
	const { data: refund } = useRefund(refundId);
	const { data: balance } = useWalletBalance();

	const form = useForm<CreateRefundValues>({
		resolver: zodResolver(createRefundSchema(remaining)),
		defaultValues: { type: "full", amount: remaining, reason: "" },
	});
	const type = useWatch({ control: form.control, name: "type" });
	const amount = Number(useWatch({ control: form.control, name: "amount" })) || 0;
	const reason = useWatch({ control: form.control, name: "reason" });

	// While processing, follow the refund as it settles (the detail query
	// polls) — derived during render rather than copied into state.
	const settledStep: Step | null =
		rawStep === "processing" && refund
			? refund.status === "completed"
				? "success"
				: refund.status === "failed"
					? "failed"
					: null
			: null;
	const step = settledStep ?? rawStep;
	const errorMessage =
		settledStep === "failed" ? (refund?.failureReason ?? "The refund failed. Your balance was restored.") : error;

	function handleTypeChange(value: "full" | "partial") {
		form.setValue("type", value);
		form.setValue("amount", value === "full" ? remaining : ("" as unknown as number));
		form.clearErrors("amount");
	}

	function handleCreate(values: CreateRefundValues) {
		setError(null);
		createRefund.mutate(
			{
				originalTransactionId: paymentId,
				amount: String(values.amount),
				reason: values.reason.trim(),
				idempotencyKey,
			},
			{
				onSuccess: (created) => {
					setRefundId(created.id);
					setStep(stepFor(created));
				},
				onError: (err) => setError(getApiErrorMessage(err, "Couldn't create this refund.")),
			},
		);
	}

	function handleAuthorize() {
		if (!refundId || pin.length !== PIN_LENGTH) return;
		setPinError(null);
		setIssues([]);
		setError(null);
		authorizeRefund.mutate(
			{ id: refundId, pin },
			{
				onSuccess: (updated) => setStep(stepFor(updated)),
				onError: (err) => {
					const code = getApiErrorCode(err);
					const status = getApiErrorStatus(err);
					setPin("");
					if (code === "INVALID_PIN") return setPinError("Wrong PIN. Try again.");
					if (code === "PIN_LOCKED") return setPinError("Too many wrong tries. Your PIN is locked for 15 minutes.");
					if (code === "PIN_NOT_SET") return setPinError("PIN_NOT_SET");
					const errIssues = getApiErrorIssues(err);
					if (status === 422 && errIssues.length > 0) return setIssues(errIssues);
					const message = getApiErrorMessage(err, "Couldn't authorize this refund.");
					if (status === 422 && /insufficient/i.test(message)) {
						setError(message);
						return setStep("authorized");
					}
					setError(message);
				},
			},
		);
	}

	function handleExecute() {
		if (!refundId) return;
		setError(null);
		executeRefund.mutate(refundId, {
			onSuccess: (updated) => setStep(stepFor(updated)),
			onError: (err) => setError(getApiErrorMessage(err, "Couldn't send this refund yet.")),
		});
	}

	function handleCancelRefund() {
		if (!refundId) return;
		cancelRefund.mutate(refundId, {
			onSuccess: () => {
				toast.success("Refund cancelled. The amount is no longer reserved.");
				onOpenChange(false);
			},
			onError: (err) => setError(getApiErrorMessage(err, "Couldn't cancel this refund.")),
		});
	}

	function handleOpenChange(next: boolean) {
		// Don't let the dialog close while a request is in flight.
		if (!next && (createRefund.isPending || authorizeRefund.isPending)) return;
		onOpenChange(next);
	}

	const summaryAmount = refund ? Number(refund.amount) : amount;
	const recipient = refund?.recipientAddress ?? payerAddress;

	return (
		<ResponsiveDialog open={open} onOpenChange={handleOpenChange}>
			<ResponsiveDialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-xl">
				{(step === "form" || step === "confirm" || step === "authorized") && (
					<ResponsiveDialogHeader>
						<ResponsiveDialogTitle>
							{step === "form" ? "Initiate refund" : step === "confirm" ? "Authorize refund" : "Refund authorized"}
						</ResponsiveDialogTitle>
						<ResponsiveDialogDescription>
							{step === "form"
								? "Initiate a refund to customers."
								: step === "confirm"
									? "Check the recipient and amount, then enter your transaction PIN to send it."
									: "Your PIN was accepted but the refund couldn't start yet."}
						</ResponsiveDialogDescription>
					</ResponsiveDialogHeader>
				)}

				{step === "form" && (
					<Form {...form}>
						<form noValidate onSubmit={form.handleSubmit(handleCreate)} className="flex flex-col gap-5">
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
										{amount > 0 && <p className="text-c1 text-muted-foreground">~ GHS {formatUsdc(usdcToGhs(amount))}</p>}
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

							<SummaryRow label="Customer's original payment wallet" value={maskWallet(payerAddress)} />
							<RefundSummary type={type} amount={amount} reason={reason} />
							{error && <Alert variant="error">{error}</Alert>}

							<Button type="submit" size="large" className="w-full" loading={createRefund.isPending}>
								Confirm
							</Button>
						</form>
					</Form>
				)}

				{step === "confirm" && (
					<div className="flex flex-col gap-5">
						<div className="flex flex-col gap-4 rounded-xl border border-secondary-300 bg-secondary-100 p-4 sm:p-5">
							<SummaryRow label="Recipient (original payer)" value={maskWallet(recipient)} />
							<SummaryRow label="You are refunding" value={`${formatUsdc(summaryAmount)} USDC`} />
							{refund?.reason && <SummaryRow label="Reason" value={refund.reason} />}
							<SummaryRow label="Network" value="Stellar Testnet" />
							<SummaryRow label="Network fee" value="Small XLM fee, paid by your wallet" />
						</div>

						{issues.length > 0 && (
							<Alert variant="warning">
								This refund can&apos;t be sent right now:
								<ul className="mt-1 list-disc pl-5">
									{issues.map((issue) => (
										<li key={issue}>{describeIssue(issue)}</li>
									))}
								</ul>
								It stays reserved. You can try again later or cancel it.
							</Alert>
						)}

						<div className="flex flex-col gap-2">
							<span className="text-label text-foreground">Transaction PIN</span>
							<OtpInput value={pin} onChange={setPin} length={PIN_LENGTH} />
							{pinError === "PIN_NOT_SET" ? (
								<p className="text-c1 text-destructive">
									You haven&apos;t set a transaction PIN yet.{" "}
									<Link href="/account" className="font-semibold underline">
										Set one in Account
									</Link>
								</p>
							) : (
								pinError && <p className="text-c1 text-destructive">{pinError}</p>
							)}
						</div>
						{error && <Alert variant="error">{error}</Alert>}

						<div className="flex flex-col gap-3 sm:flex-row-reverse">
							<Button
								type="button"
								size="large"
								className="w-full"
								disabled={pin.length !== PIN_LENGTH}
								loading={authorizeRefund.isPending}
								onClick={handleAuthorize}
							>
								Authorize refund
							</Button>
							<Button
								type="button"
								size="large"
								variant="outline"
								className="w-full"
								loading={cancelRefund.isPending}
								onClick={handleCancelRefund}
							>
								Cancel refund
							</Button>
						</div>
					</div>
				)}

				{step === "authorized" && (
					<div className="flex flex-col gap-5">
						<Alert variant="warning">
							{error ?? "There isn't enough USDC in your business balance to send this refund."} Top up your
							wallet, then retry — no PIN needed.
						</Alert>
						<div className="flex flex-col gap-3 sm:flex-row-reverse">
							<Button type="button" size="large" className="w-full" loading={executeRefund.isPending} onClick={handleExecute}>
								Retry refund
							</Button>
							<Button
								type="button"
								size="large"
								variant="outline"
								className="w-full"
								loading={cancelRefund.isPending}
								onClick={handleCancelRefund}
							>
								Cancel refund
							</Button>
						</div>
					</div>
				)}

				{step === "processing" && (
					<div className="flex flex-col items-center gap-4 py-10 text-center">
						<ResponsiveDialogTitle className="sr-only">Processing refund</ResponsiveDialogTitle>
						<Loader2 className="size-12 animate-spin text-primary-600" aria-hidden="true" />
						<p className="text-s1 text-foreground">Confirming on Stellar…</p>
						<p className="text-b3 text-muted-foreground">
							The refund has been submitted. You can close this window — it keeps confirming and shows up in your
							refund history.
						</p>
					</div>
				)}

				{step === "success" && (
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
							<p className="text-h5 text-foreground sm:text-h4">{formatUsdc(summaryAmount)} USDC</p>
							<p className="text-b4 text-muted-foreground sm:text-b3">~ GHS {formatUsdc(usdcToGhs(summaryAmount))}</p>
						</div>
						<div className="flex w-full flex-col gap-1 text-left">
							<span className="text-c1 text-muted-foreground sm:text-b3">To</span>
							<span className="text-b3 text-foreground">Customer&apos;s original payment wallet</span>
							<span className="text-b2 font-semibold break-all text-foreground">{maskWallet(recipient)}</span>
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
							{refundId && (
								<button
									type="button"
									onClick={() => {
										onOpenChange(false);
										router.push(`/refunds/${paymentId}/${refundId}`);
									}}
									className="text-b3 font-medium text-foreground hover:underline"
								>
									View Refund details
								</button>
							)}
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
						{errorMessage && <Alert variant="error">{errorMessage}</Alert>}
						<p className="text-b3 text-muted-foreground">
							A failed refund isn&apos;t counted as refunded and your balance is restored. You can start a new
							refund if needed.
						</p>
						<Button type="button" size="large" className="w-full" onClick={() => onOpenChange(false)}>
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
			<SummaryRow label="You are refunding" value={`${formatUsdc(amount)} USDC`} />
		</div>
	);
}

export { InitiateRefundDialog };
