"use client";

import { useState } from "react";
import { Copy, Loader2 } from "lucide-react";
import {
	Dialog,
	DialogTrigger,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogDescription,
} from "@repo/ui/dialog";
import { Button } from "@repo/ui/button";
import { toast } from "@repo/ui/sonner";
import { VerifyCodeForm } from "@/features/auth/components/VerifyCodeForm";
import { useEnroll2fa, useConfirm2fa } from "@/features/profile/hooks";
import { getApiErrorMessage } from "@/lib/api/errorMessage";
import type { EnrollTotpData } from "@/lib/api/types";

type Step = "loading" | "setup" | "confirm";

interface TwoFactorEnrollDialogProps {
	children: React.ReactNode;
	onEnabled: () => void;
}

async function copyText(text: string, label: string) {
	try {
		await navigator.clipboard.writeText(text);
		toast.success(`${label} copied`);
	} catch {
		toast.error("Couldn't copy");
	}
}

/**
 * Enable-2FA flow — three steps in one dialog, same shape as
 * `FundWalletDialog`: request a fresh enrollment as soon as it opens (real
 * QR code + one-time recovery codes from `POST /auth/2fa/enroll`), show
 * them once, then confirm activation with the first code from the
 * authenticator app (`POST /auth/2fa/confirm`, reusing the same
 * `VerifyCodeForm` Sign In's own 2FA step uses for `method="authenticator"`).
 * No mock exists for this screen — account-settings 2FA enrollment was
 * never part of a provided design — so this follows the app's own
 * established patterns (Dialog steps, the secondary/gold "save this" box
 * `TransactionDetail`'s amount uses) rather than inventing new ones.
 */
function TwoFactorEnrollDialog({ children, onEnabled }: TwoFactorEnrollDialogProps) {
	const [open, setOpen] = useState(false);
	const [step, setStep] = useState<Step>("loading");
	const [enrollment, setEnrollment] = useState<EnrollTotpData | null>(null);
	const enroll = useEnroll2fa();
	const confirm = useConfirm2fa();

	function handleOpenChange(next: boolean) {
		setOpen(next);
		if (next) {
			setStep("loading");
			setEnrollment(null);
			enroll.mutate(undefined, {
				onSuccess: (data) => {
					setEnrollment(data);
					setStep("setup");
				},
				onError: (error) => {
					toast.error(getApiErrorMessage(error, "Couldn't start 2FA setup"));
					setOpen(false);
				},
			});
		}
	}

	function handleConfirm(values: { code: string }) {
		confirm.mutate(values.code, {
			onSuccess: () => {
				toast.success("2-factor authentication enabled");
				setOpen(false);
				onEnabled();
			},
			onError: (error) => {
				toast.error(getApiErrorMessage(error, "Invalid code"));
			},
		});
	}

	return (
		<Dialog open={open} onOpenChange={handleOpenChange}>
			<DialogTrigger asChild>{children}</DialogTrigger>
			<DialogContent>
				{step === "loading" && (
					<div className="flex flex-col items-center gap-3 py-10 text-center">
						<Loader2 className="size-6 animate-spin text-primary-500" aria-hidden="true" />
						<p className="text-b3 text-muted-foreground">Setting up 2FA…</p>
					</div>
				)}

				{step === "setup" && enrollment && (
					<>
						<DialogHeader>
							<DialogTitle>Set up 2-factor authentication</DialogTitle>
							<DialogDescription>
								Scan this QR code with your authenticator app (Google
								Authenticator, Authy, or similar).
							</DialogDescription>
						</DialogHeader>

						<div className="flex flex-col items-center gap-3">
							{/* eslint-disable-next-line @next/next/no-img-element -- a
							    base64 data: URL from the API response, not a static asset
							    next/image could optimize. */}
							<img
								src={enrollment.qrCodeDataUrl}
								alt="2FA setup QR code"
								className="size-44 rounded-xl border border-border p-2"
							/>
							<button
								type="button"
								onClick={() => copyText(enrollment.otpAuthUri, "Setup code")}
								className="flex items-center gap-1.5 text-b3 font-medium text-primary hover:underline"
							>
								<Copy className="size-4" aria-hidden="true" />
								Can&apos;t scan? Copy setup code
							</button>
						</div>

						<div className="flex flex-col gap-3 rounded-xl border border-secondary-300 bg-secondary-100 p-4">
							<div className="flex items-center justify-between gap-2">
								<span className="text-b3 font-semibold text-foreground">
									Recovery codes
								</span>
								<button
									type="button"
									onClick={() =>
										copyText(enrollment.recoveryCodes.join("\n"), "Recovery codes")
									}
									className="flex items-center gap-1.5 text-c1 font-medium text-foreground hover:text-primary-600"
								>
									<Copy className="size-3.5" aria-hidden="true" />
									Copy all
								</button>
							</div>
							<p className="text-c1 text-muted-foreground">
								Save these somewhere safe — each works once, if you ever lose
								access to your authenticator app. They won&apos;t be shown
								again.
							</p>
							<div className="grid grid-cols-2 gap-x-4 gap-y-1.5 font-mono text-b3 text-foreground">
								{enrollment.recoveryCodes.map((code) => (
									<span key={code}>{code}</span>
								))}
							</div>
						</div>

						<Button
							type="button"
							size="large"
							className="w-full"
							onClick={() => setStep("confirm")}
						>
							Continue
						</Button>
					</>
				)}

				{step === "confirm" && (
					<>
						<DialogHeader>
							<DialogTitle>Confirm setup</DialogTitle>
						</DialogHeader>
						<VerifyCodeForm
							method="authenticator"
							submitLabel="Enable 2FA"
							isPending={confirm.isPending}
							onSubmit={handleConfirm}
						/>
					</>
				)}
			</DialogContent>
		</Dialog>
	);
}

export { TwoFactorEnrollDialog };
