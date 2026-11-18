"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { RefreshCw, RotateCcw } from "lucide-react";
import { Alert } from "@repo/ui/alert";
import { Button } from "@repo/ui/button";
import { toast } from "@repo/ui/sonner";
import { useAxiosAuth } from "@/hooks/useAxiosAuth";
import { useRecheckTransfer } from "@/features/send/hooks";
import { SendPinDialog } from "@/features/send/components/SendPinDialog";
import { apiRoutes } from "@/lib/config/apiRoutes";
import { getApiErrorCode, getApiErrorMessage, getApiErrorStatus } from "@/lib/api/errorMessage";
import type { ApiSuccessResponse, SendMoneyResponseData, TransactionData } from "@/lib/api/types";

/** `POST /transfers/:id/retry` — failed transfers only, once; external
 * sends are looked up on Stellar first and refused (409) if they succeeded
 * or may still complete. */
function useRetryTransfer() {
	const axiosAuth = useAxiosAuth();
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: async ({ id, pin }: { id: string; pin: string }) => {
			const { data } = await axiosAuth.post<ApiSuccessResponse<SendMoneyResponseData>>(apiRoutes.transfers.retry(id), { pin });
			return data.data;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["transactions"] });
			queryClient.invalidateQueries({ queryKey: ["dashboard", "balance"] });
		},
	});
}

/**
 * Transaction recovery (v3 deliverable 4), outgoing transfers only:
 * - pending/processing → "Check status" (`POST /transfers/:id/recheck`):
 *   asks Stellar again, never pays twice. A timeout is not a failure.
 * - failed → "Retry transfer" with the PIN; already-retried transfers
 *   (`retryOfId` on the new one) are refused by the API.
 */
function TransactionRecoveryActions({ transaction }: { transaction: TransactionData }) {
	const router = useRouter();
	const queryClient = useQueryClient();
	const recheck = useRecheckTransfer();
	const retry = useRetryTransfer();
	const [pinOpen, setPinOpen] = useState(false);
	const [message, setMessage] = useState<string | null>(null);

	const isTransfer =
		transaction.direction === "outgoing" &&
		(transaction.type === "internal_transfer" || transaction.type === "withdrawal");
	if (!isTransfer) return null;

	const inFlight = transaction.status === "pending" || transaction.status === "processing";
	const failed = transaction.status === "failed";
	if (!inFlight && !failed) return null;

	function handleRecheck() {
		setMessage(null);
		recheck.mutate(transaction.id, {
			onSuccess: (status) => {
				queryClient.invalidateQueries({ queryKey: ["transactions"] });
				setMessage(
					status.status === "completed"
						? "Confirmed — the transfer completed."
						: status.status === "failed"
							? `The transfer failed${status.failureReason ? `: ${status.failureReason}` : ""}. Your balance was restored.`
							: "Still not confirmed by Stellar. Check again in a few seconds — don't send it again.",
				);
			},
			onError: (error) => setMessage(getApiErrorMessage(error, "Couldn't reach Stellar. Try again shortly.")),
		});
	}

	function handleRetry(pin: string) {
		setPinOpen(false);
		setMessage(null);
		retry.mutate(
			{ id: transaction.id, pin },
			{
				onSuccess: (result) => {
					toast.success(result.status === "processing" ? "Retry submitted — confirming on Stellar" : "Transfer sent");
					router.push(`/transactions/${result.transactionId}`);
				},
				onError: (error) => {
					const code = getApiErrorCode(error);
					if (code === "INVALID_PIN") return setMessage("Wrong PIN. Try again.");
					if (code === "PIN_LOCKED") return setMessage("Too many wrong tries. Your PIN is locked for 15 minutes.");
					if (getApiErrorStatus(error) === 409)
						return setMessage(getApiErrorMessage(error, "This transfer may still complete — check its status instead."));
					setMessage(getApiErrorMessage(error, "Couldn't retry this transfer."));
				},
			},
		);
	}

	return (
		<div className="flex flex-col gap-3 rounded-2xl border border-border bg-background p-5 sm:p-6">
			<h2 className="text-b2 font-semibold text-foreground">{inFlight ? "Waiting for confirmation" : "Transfer failed"}</h2>
			<p className="text-c1 text-muted-foreground sm:text-b3">
				{inFlight
					? "Stellar hasn't confirmed this transfer yet. Checking its status is safe and never sends the money twice."
					: "Nothing was sent and your balance was restored. You can retry it once with your PIN."}
			</p>
			{message && <Alert variant="info">{message}</Alert>}
			<div>
				{inFlight ? (
					<Button type="button" variant="outline" loading={recheck.isPending} onClick={handleRecheck}>
						<RefreshCw className="size-4" aria-hidden="true" />
						Check status
					</Button>
				) : (
					<Button type="button" variant="outline" loading={retry.isPending} onClick={() => setPinOpen(true)}>
						<RotateCcw className="size-4" aria-hidden="true" />
						Retry transfer
					</Button>
				)}
			</div>
			<SendPinDialog open={pinOpen} onOpenChange={setPinOpen} onConfirm={handleRetry} />
		</div>
	);
}

export { TransactionRecoveryActions };
