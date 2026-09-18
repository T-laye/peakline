"use client";

import { useState } from "react";
import { Eye, EyeOff, Pencil, Trash2, Loader2 } from "lucide-react";
import { Button } from "@repo/ui/button";
import { useAdminConfigValue, useForgetConfigValue } from "@/features/config/hooks";
import { formatDateTime } from "@/lib/format";
import { getApiErrorMessage } from "@/lib/api/errorMessage";
import type { AdminConfigKeyData } from "@/lib/api/types";

interface ConfigKeyRowProps {
	item: AdminConfigKeyData;
	onEdit: () => void;
	onDelete: () => void;
}

/** Owns its own "revealed or not" state — `useAdminConfigValue`'s query
 * only actually fires once `revealed` flips true, and `onOpenChange`-style
 * "Hide" both flips it back AND drops the decrypted value from the query
 * cache (`useForgetConfigValue`) rather than leaving a fetched secret
 * sitting in memory after the admin says they're done looking at it. */
function ConfigKeyRow({ item, onEdit, onDelete }: ConfigKeyRowProps) {
	const [revealed, setRevealed] = useState(false);
	const forget = useForgetConfigValue();
	const { data: revealedValue, isLoading, isError, error } = useAdminConfigValue(item.key, revealed);

	function handleToggleReveal() {
		if (revealed) {
			setRevealed(false);
			forget(item.key);
		} else {
			setRevealed(true);
		}
	}

	return (
		<div className="flex flex-col gap-3 rounded-xl border border-border p-4">
			<div className="flex flex-wrap items-start justify-between gap-3">
				<div className="flex min-w-0 flex-col gap-0.5">
					<span className="text-b2 font-mono font-medium text-foreground">{item.key}</span>
					<span className="text-c1 text-muted-foreground">
						Updated {formatDateTime(item.updatedAt)}
					</span>
				</div>
				<div className="flex shrink-0 gap-2">
					<Button
						type="button"
						variant="outline"
						size="small"
						onClick={handleToggleReveal}
						aria-label={revealed ? `Hide value for ${item.key}` : `Reveal value for ${item.key}`}
					>
						{revealed ? (
							<EyeOff className="size-4" aria-hidden="true" />
						) : (
							<Eye className="size-4" aria-hidden="true" />
						)}
						{revealed ? "Hide" : "Reveal"}
					</Button>
					<Button
						type="button"
						variant="outline"
						size="small"
						iconOnly
						aria-label={`Update ${item.key}`}
						onClick={onEdit}
					>
						<Pencil className="size-4" aria-hidden="true" />
					</Button>
					<Button
						type="button"
						variant="outline"
						size="small"
						iconOnly
						className="border-destructive text-destructive hover:bg-danger-50"
						aria-label={`Delete ${item.key}`}
						onClick={onDelete}
					>
						<Trash2 className="size-4" aria-hidden="true" />
					</Button>
				</div>
			</div>

			{revealed && (
				<div className="rounded-lg bg-muted p-3">
					{isLoading ? (
						<span className="flex items-center gap-2 text-c1 text-muted-foreground">
							<Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
							Decrypting…
						</span>
					) : isError ? (
						<span className="text-c1 text-destructive">
							{getApiErrorMessage(error, "Couldn't load this value")}
						</span>
					) : (
						<code className="wrap-break-word text-b3 font-mono text-foreground">
							{revealedValue?.value}
						</code>
					)}
				</div>
			)}
		</div>
	);
}

export { ConfigKeyRow };
