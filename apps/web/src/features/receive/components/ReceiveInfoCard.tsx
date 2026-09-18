"use client";

import { Copy } from "lucide-react";
import { toast } from "@repo/ui/sonner";

interface ReceiveInfoCardProps {
	label: string;
	/** What's displayed — may be masked (e.g. the wallet address) or a plain
	 * description, unlike `copyValue`. */
	value: string;
	/** What actually lands on the clipboard — always the real, unmasked value. */
	copyValue: string;
}

/** One of the three Receive cards (payment link / wallet address / payment
 * request) — same label+value+copy shape for all three, per the mock. */
function ReceiveInfoCard({ label, value, copyValue }: ReceiveInfoCardProps) {
	async function handleCopy() {
		try {
			await navigator.clipboard.writeText(copyValue);
			toast.success(`${label} copied`);
		} catch {
			toast.error("Couldn't copy");
		}
	}

	return (
		<div className="flex items-center justify-between gap-4 rounded-2xl border border-border bg-background p-5 sm:p-6">
			<div className="flex min-w-0 flex-col gap-1.5">
				<span className="text-b3 font-semibold text-foreground sm:text-b2">{label}</span>
				<span className="truncate text-c1 text-muted-foreground sm:text-b3">{value}</span>
			</div>
			<button
				type="button"
				onClick={handleCopy}
				aria-label={`Copy ${label}`}
				className="shrink-0 text-muted-foreground hover:text-foreground"
			>
				<Copy className="size-5" aria-hidden="true" />
			</button>
		</div>
	);
}

export { ReceiveInfoCard };
