"use client";

import { useState } from "react";
import { UserRound } from "lucide-react";
import { Button } from "@repo/ui/button";
import { SendPinDialog } from "@/features/send/components/SendPinDialog";
import {
	TRANSFER_METHODS,
	type SendMoneyValues,
} from "@/lib/validations/sendValidations";
import { formatUsdc, usdcToGhs } from "@/lib/currency";

function DetailRow({ label, value, muted }: { label: string; value: string; muted?: boolean }) {
	return (
		<div className="flex items-start justify-between gap-4 text-c1 sm:text-b3">
			<span className="text-muted-foreground">{label}</span>
			<span
				className={muted ? "text-muted-foreground" : "font-semibold text-foreground"}
			>
				{value}
			</span>
		</div>
	);
}

interface ReviewTransferStepProps {
	values: SendMoneyValues;
	onContinue: (pin: string) => void;
}

/** Step 2 — mirrors `ConfirmFundingStep`'s shape (summary card + detail
 * card). The transaction PIN a real send requires isn't entered inline
 * here anymore — `SendPinDialog` (a modal on desktop, a bottom-sheet drawer
 * on mobile, same pattern `ChangePinDialog` uses) opens once "Send" is
 * tapped, keeping this screen a pure summary and "authorize this transfer"
 * its own explicit step. There's no "resolve this identifier to a name"
 * endpoint for a raw username/wallet entry, so unlike an earlier version of
 * this screen, the "To" row shows the identifier as typed rather than a
 * fabricated recipient name for those two methods — the real name/label
 * (`recipientLabel`) only comes back once the transfer actually completes
 * (see `TransferSuccessStep`). A phone-search or name-search match (see
 * `SendMoneyFormStep`) already resolved a real name before reaching here,
 * so `values.recipientName` (set to `phone`'s value in that case, or
 * whoever a name search resolved to) takes over when present. */
function ReviewTransferStep({ values, onContinue }: ReviewTransferStepProps) {
	const [pinDialogOpen, setPinDialogOpen] = useState(false);
	const methodLabel =
		TRANSFER_METHODS.find((method) => method.value === values.method)?.label ??
		values.method;

	return (
		<div className="flex flex-col gap-5">
			<div className="flex flex-col gap-1 rounded-xl border border-secondary-300 bg-secondary-100 p-4 sm:p-5">
				<span className="text-c1 text-muted-foreground sm:text-b3">You are sending</span>
				<span className="text-h5 text-foreground sm:text-h4">
					{formatUsdc(values.amount)} USDC
				</span>
				<span className="text-c1 text-muted-foreground sm:text-b3">
					~ GHS {formatUsdc(usdcToGhs(values.amount))}
				</span>
			</div>

			<div className="flex flex-col gap-2">
				<span className="text-c1 text-muted-foreground sm:text-b3">To</span>
				<div className="flex items-center gap-3 rounded-xl border border-border p-4 sm:p-5">
					<span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary-100 text-primary-700">
						<UserRound className="size-5" aria-hidden="true" />
					</span>
					<div className="flex min-w-0 flex-col">
						<span className="truncate text-b3 font-semibold text-foreground sm:text-b2">
							{values.recipientName ?? values.recipient}
						</span>
						<span className="text-c1 text-muted-foreground sm:text-b3">{methodLabel}</span>
					</div>
				</div>
			</div>

			<div className="flex flex-col gap-3 rounded-xl border border-border p-4 sm:p-5">
				<DetailRow label="Transfer Method" value={methodLabel} />
				<DetailRow label="Network" value="Stellar" />
				<DetailRow label="Est. Fee" value="0.00 USDC" muted />
				{values.note && <DetailRow label="Note" value={values.note} muted />}
				<DetailRow label="Total" value={`${formatUsdc(values.amount)} USDC`} />
			</div>

			<Button type="button" size="large" className="w-full" onClick={() => setPinDialogOpen(true)}>
				Send
			</Button>

			<SendPinDialog
				open={pinDialogOpen}
				onOpenChange={setPinDialogOpen}
				onConfirm={onContinue}
			/>
		</div>
	);
}

export { ReviewTransferStep };
