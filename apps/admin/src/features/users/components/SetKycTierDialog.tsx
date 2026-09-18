"use client";

import { useState } from "react";
import { Button } from "@repo/ui/button";
import { Select } from "@repo/ui/select";
import { Textarea } from "@repo/ui/textarea";
import { Label } from "@repo/ui/label";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogDescription,
	DialogFooter,
	DialogClose,
} from "@repo/ui/dialog";

interface SetKycTierDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	currentTier: number;
	isPending: boolean;
	onConfirm: (tier: 0 | 1 | 2 | 3, reason: string) => void;
}

function SetKycTierDialog({
	open,
	onOpenChange,
	currentTier,
	isPending,
	onConfirm,
}: SetKycTierDialogProps) {
	const [tier, setTier] = useState<0 | 1 | 2 | 3>(currentTier as 0 | 1 | 2 | 3);
	const [reason, setReason] = useState("");

	function handleOpenChange(next: boolean) {
		if (!next) {
			setTier(currentTier as 0 | 1 | 2 | 3);
			setReason("");
		}
		onOpenChange(next);
	}

	return (
		<Dialog open={open} onOpenChange={handleOpenChange}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Set KYC tier</DialogTitle>
					<DialogDescription>
						Manually overrides this account&apos;s verification tier — currently Tier {currentTier}.
					</DialogDescription>
				</DialogHeader>

				<div className="flex flex-col gap-1.5">
					<Label htmlFor="kyc-tier">New tier</Label>
					<Select
						id="kyc-tier"
						value={String(tier)}
						onChange={(e) => setTier(Number(e.target.value) as 0 | 1 | 2 | 3)}
					>
						<option value="0">Tier 0</option>
						<option value="1">Tier 1</option>
						<option value="2">Tier 2</option>
						<option value="3">Tier 3</option>
					</Select>
				</div>

				<div className="flex flex-col gap-1.5">
					<Label htmlFor="kyc-tier-reason">Reason (optional)</Label>
					<Textarea
						id="kyc-tier-reason"
						value={reason}
						onChange={(e) => setReason(e.target.value)}
						placeholder="Why is this being changed manually?"
					/>
				</div>

				<DialogFooter className="sm:flex-row sm:justify-end">
					<DialogClose asChild>
						<Button type="button" variant="outline" className="w-full sm:w-auto">
							Cancel
						</Button>
					</DialogClose>
					<Button
						type="button"
						loading={isPending}
						onClick={() => onConfirm(tier, reason.trim())}
						className="w-full sm:w-auto"
					>
						Save tier
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

export { SetKycTierDialog };
