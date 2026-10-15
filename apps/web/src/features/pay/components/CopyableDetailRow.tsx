"use client";

import { Copy } from "lucide-react";
import { toast } from "@repo/ui/sonner";
import { cn } from "@repo/ui/lib/utils";

interface CopyableDetailRowProps {
	label: string;
	/** What's displayed — may be truncated, unlike `copyValue`. */
	value: string;
	/** Defaults to `value`. Pass the full value when `value` is truncated. */
	copyValue?: string;
	/** Long unbroken strings (addresses, memos) wrap instead of overflowing. */
	breakAll?: boolean;
}

/** Label-over-value row with a copy button, for details the payer has to
 * transfer into another app (their external wallet) character-for-character. */
function CopyableDetailRow({ label, value, copyValue, breakAll }: CopyableDetailRowProps) {
	async function handleCopy() {
		try {
			await navigator.clipboard.writeText(copyValue ?? value);
			toast.success(`${label} copied`);
		} catch {
			toast.error("Couldn't copy");
		}
	}

	return (
		<div className="flex items-start justify-between gap-4">
			<div className="flex min-w-0 flex-col gap-0.5">
				<span className="text-c1 text-muted-foreground sm:text-b4">{label}</span>
				<span
					className={cn(
						"text-b4 font-semibold text-foreground sm:text-b3",
						breakAll ? "break-all" : "truncate",
					)}
				>
					{value}
				</span>
			</div>
			<button
				type="button"
				onClick={handleCopy}
				aria-label={`Copy ${label}`}
				className="mt-0.5 shrink-0 text-muted-foreground hover:text-foreground"
			>
				<Copy className="size-5" aria-hidden="true" />
			</button>
		</div>
	);
}

export { CopyableDetailRow };
