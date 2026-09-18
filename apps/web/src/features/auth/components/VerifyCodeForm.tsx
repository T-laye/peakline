"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { KeyRound } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@repo/ui/button";
import { OtpInput } from "@repo/ui/otp-input";
import {
	Form,
	FormField,
	FormItem,
	FormControl,
	FormMessage,
} from "@repo/ui/form";
import { toast } from "@repo/ui/sonner";
import verifyEmailIllustration from "@repo/ui/assets/illustrations/auth/verify-email-illustration.svg";
import {
	verifyOtpSchema,
	type VerifyOtpValues,
} from "@/lib/validations/authValidations";

const RESEND_SECONDS = 45;

interface VerifyCodeFormProps {
	/** "email" shows the mailed-illustration + destination + resend timer
	 * (Figma node 127:2709); "authenticator" swaps in a generic code-entry
	 * chrome since that's not a Figma screen — there's no mockup for 2FA via
	 * an authenticator app, just the method-picker (150:3004). */
	method: "email" | "authenticator";
	/** Email address to display — required (and only used) for `method: "email"`. */
	destination?: string;
	submitLabel?: string;
	isPending: boolean;
	onSubmit: (values: VerifyOtpValues) => void;
	onUseAnotherMethod?: () => void;
	/** Seeds the countdown from a real `OtpSentDto.ttlSeconds` instead of the
	 * hardcoded default — e.g. sign-up's Verify step seeds this from
	 * `/auth/register`'s response. */
	initialSeconds?: number;
	/** When provided, "Resend code" calls the real `/auth/resend-otp`
	 * instead of just resetting the timer — return the new `ttlSeconds` to
	 * reseed the countdown accurately, or throw/reject to leave the
	 * countdown running (the caller is expected to toast the error).
	 * Omitted for flows with no backend counterpart yet (login's 2FA). */
	onResend?: () => Promise<number>;
}

/**
 * Shared 6-digit code entry, reused by Sign Up's email verification and
 * Sign In's 2FA step — same Figma frame (127:2709) either way, just with the
 * chrome swapped for an authenticator code when that's the chosen method.
 */
function VerifyCodeForm({
	method,
	destination,
	submitLabel = "Verify",
	isPending,
	onSubmit,
	onUseAnotherMethod,
	initialSeconds = RESEND_SECONDS,
	onResend,
}: VerifyCodeFormProps) {
	const form = useForm<VerifyOtpValues>({
		resolver: zodResolver(verifyOtpSchema),
		defaultValues: { code: "" },
	});
	const [secondsLeft, setSecondsLeft] = useState(initialSeconds);

	useEffect(() => {
		if (method !== "email" || secondsLeft === 0) return;
		const timer = setInterval(() => setSecondsLeft((s) => s - 1), 1000);
		return () => clearInterval(timer);
	}, [method, secondsLeft]);

	async function handleResend() {
		if (onResend) {
			try {
				setSecondsLeft(await onResend());
			} catch {
				// Caller already surfaced the error (e.g. a toast) — leave the
				// countdown running so the user retries once it allows again.
			}
			return;
		}
		setSecondsLeft(RESEND_SECONDS);
		toast.info("New code sent");
	}

	return (
		<div className="flex flex-col items-center gap-8 text-center">
			{method === "email" ? (
				<Image src={verifyEmailIllustration} alt="" className="size-32" />
			) : (
				<span className="flex size-20 items-center justify-center rounded-full bg-primary-500/10">
					<KeyRound className="size-9 text-primary-500" aria-hidden="true" />
				</span>
			)}

			<div className="flex flex-col gap-2">
				<h1 className="text-h4 sm:text-h3 text-foreground">
					{method === "email" ? "Verify your email" : "Enter your code"}
				</h1>
				<p className="text-sm sm:text-b1 text-muted-foreground">
					{method === "email" ? (
						<>
							We&apos;ve sent a 6-digit verification code to{" "}
							<span className="font-semibold text-foreground">
								{destination}
							</span>
						</>
					) : (
						"Enter the 6-digit code from your authenticator app."
					)}
				</p>
			</div>

			<Form {...form}>
				<form
					noValidate
					onSubmit={form.handleSubmit(onSubmit)}
					className="flex w-full flex-col items-center gap-5"
				>
					<FormField
						control={form.control}
						name="code"
						render={({ field }) => (
							<FormItem className="w-full">
								<FormControl>
									<OtpInput
										value={field.value}
										onChange={field.onChange}
										disabled={isPending}
									/>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>

					{method === "email" && (
						<p className="text-b3 text-muted-foreground">
							Didn&apos;t receive the code?{" "}
							{secondsLeft > 0 ? (
								`Resend code in ${String(Math.floor(secondsLeft / 60)).padStart(2, "0")}:${String(secondsLeft % 60).padStart(2, "0")}`
							) : (
								<button
									type="button"
									onClick={handleResend}
									className="font-medium text-primary underline hover:no-underline"
								>
									Resend code
								</button>
							)}
						</p>
					)}

					<Button
						type="submit"
						size="large"
						className="w-full"
						loading={isPending}
					>
						{submitLabel}
					</Button>
				</form>
			</Form>

			{onUseAnotherMethod && (
				<button
					type="button"
					onClick={onUseAnotherMethod}
					className="text-b3 font-medium text-muted-foreground underline hover:text-foreground"
				>
					Use another method
				</button>
			)}
		</div>
	);
}

export { VerifyCodeForm };
export type { VerifyCodeFormProps };
