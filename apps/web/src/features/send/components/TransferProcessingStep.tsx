"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@repo/ui/button";
import { useRecheckTransfer, useSendMoney, useTransferStatus } from "@/features/send/hooks";
import { getApiErrorIssues, getApiErrorMessage } from "@/lib/api/errorMessage";
import { describeIssue } from "@/lib/stellarIssues";
import { formatUsdc } from "@/lib/currency";
import type { SendMoneyValues } from "@/lib/validations/sendValidations";
import type { SendMoneyResponseData } from "@/lib/api/types";

interface TransferProcessingStepProps {
	values: SendMoneyValues;
	pin: string;
	onSuccess: (result: SendMoneyResponseData) => void;
	onError: (message: string) => void;
}

/**
 * Sends once, then follows the outcome (frontend-integration.md §5.2–5.3):
 * - `completed` → success.
 * - `processing` → the Stellar outcome isn't known yet. Stay here as
 *   "Confirming…", poll `GET /transfers/:id`, and offer "Check status"
 *   (`POST /transfers/:id/recheck`). Never send again — the server would
 *   return the same transfer anyway, but a resend must not look like a
 *   second payment.
 * - 422 with `details.issues` → refused before anything was debited.
 */
function TransferProcessingStep({ values, pin, onSuccess, onError }: TransferProcessingStepProps) {
	const sendMoney = useSendMoney();
	const recheck = useRecheckTransfer();
	const started = useRef(false);
	const [pending, setPending] = useState<SendMoneyResponseData | null>(null);
	const { data: status } = useTransferStatus(pending?.transactionId ?? null);

	useEffect(() => {
		if (started.current) return;
		started.current = true;
		sendMoney.mutate(
			{ values, pin },
			{
				onSuccess: (result) => {
					if (result.status === "processing") setPending(result);
					else if (result.status === "failed") onError("The transfer failed and your balance was restored.");
					else onSuccess(result);
				},
				onError: (error) => {
					const issues = getApiErrorIssues(error);
					onError(
						issues.length > 0
							? `Nothing was sent: ${issues.map(describeIssue).join(" ")}`
							: getApiErrorMessage(error, "Transfer could not be processed"),
					);
				},
			},
		);
		// Runs once per mount by design (guarded by `started`).
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	// Settle once the polled/rechecked status is final.
	useEffect(() => {
		if (!pending || !status) return;
		if (status.status === "completed") {
			onSuccess({ ...pending, status: "completed", stellarTxHash: status.stellarTxHash ?? pending.stellarTxHash });
		} else if (status.status === "failed" || status.status === "reversed") {
			onError(status.failureReason ?? "The transfer failed and your balance was restored.");
		}
	}, [pending, status, onSuccess, onError]);

	return (
		<div className="flex min-h-full flex-col items-center justify-center gap-6 text-center">
			<Loader2 className="size-12 animate-spin text-primary-500 sm:size-14" aria-hidden="true" />
			<div className="flex flex-col gap-2">
				<h2 className="text-s1 text-foreground sm:text-h5">
					{pending ? "Confirming on Stellar…" : "Processing your transfer"}
				</h2>
				<p className="text-b4 text-muted-foreground sm:text-b3">
					{pending
						? `Your ${formatUsdc(values.amount)} USDC transfer was submitted. Stellar hasn't confirmed it yet — don't send it again.`
						: `Sending ${formatUsdc(values.amount)} USDC — this only takes a moment.`}
				</p>
			</div>
			{pending && (
				<Button
					type="button"
					variant="outline"
					loading={recheck.isPending}
					onClick={() => recheck.mutate(pending.transactionId)}
				>
					Check status
				</Button>
			)}
		</div>
	);
}

export { TransferProcessingStep };
