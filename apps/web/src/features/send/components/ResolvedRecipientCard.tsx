"use client";

import { AlertCircle } from "lucide-react";
import { Skeleton } from "@repo/ui/skeleton";
import { UserAvatar } from "@/features/dashboard/components/UserAvatar";

interface ResolvedRecipientCardProps {
	isLoading: boolean;
	name?: string;
	notFound: boolean;
}

/**
 * Shown above `SendMoneyFormStep` only when arriving via someone's Receive
 * QR/link (`?userId=`, see `SendMoneyPage`) — confirms who the payer is
 * about to pay (`GET /wallets/lookup/{userId}`, via `useWalletLookup`)
 * before they even reach the amount field, the one thing a bare
 * wallet-address paste could never show.
 *
 * `notFound` covers the lookup's own real 404 ("no active individual wallet
 * found for this user") — a dead or malformed link, not a form-validation
 * error, so it gets its own message here rather than a generic "recipient"
 * field complaint the person never actually typed into.
 */
function ResolvedRecipientCard({ isLoading, name, notFound }: ResolvedRecipientCardProps) {
	if (isLoading) {
		return (
			<div className="flex items-center gap-3 rounded-2xl border border-border bg-background p-4">
				<Skeleton className="size-11 shrink-0 rounded-full" />
				<Skeleton className="h-4 w-32" />
			</div>
		);
	}

	if (notFound) {
		return (
			<div className="flex items-center gap-3 rounded-2xl border border-destructive/30 bg-destructive/5 p-4">
				<AlertCircle className="size-5 shrink-0 text-destructive" aria-hidden="true" />
				<p className="text-b3 text-destructive">
					This link&apos;s recipient couldn&apos;t be found — check the link, or ask them for
					their wallet address instead.
				</p>
			</div>
		);
	}

	if (!name) return null;

	return (
		<div className="flex items-center gap-3 rounded-2xl border border-border bg-background p-4">
			<UserAvatar name={name} className="size-11 text-b1" />
			<div className="flex flex-col">
				<span className="text-c1 text-muted-foreground">Paying</span>
				<span className="text-b3 font-semibold text-foreground">{name}</span>
			</div>
		</div>
	);
}

export { ResolvedRecipientCard };
