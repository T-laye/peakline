"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { Button } from "@repo/ui/button";
import { cn } from "@repo/ui/lib/utils";

interface CopyButtonProps {
	value: string;
	label?: string;
	className?: string;
}

/** Small copy-to-clipboard button with its own "Copied" feedback state,
 * shared wherever a screen shows a value someone plausibly wants to paste
 * elsewhere (a public code, a temporary password, a wallet address) rather
 * than each place re-implementing `navigator.clipboard` + a timeout. */
function CopyButton({ value, label = "Copy", className }: CopyButtonProps) {
	const [copied, setCopied] = useState(false);

	function handleCopy() {
		navigator.clipboard.writeText(value).then(() => {
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
		});
	}

	return (
		<Button
			type="button"
			variant="outline"
			size="small"
			onClick={handleCopy}
			className={cn("shrink-0", className)}
		>
			{copied ? (
				<Check className="size-4" aria-hidden="true" />
			) : (
				<Copy className="size-4" aria-hidden="true" />
			)}
			{copied ? "Copied" : label}
		</Button>
	);
}

export { CopyButton };
