"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@repo/ui/button";
import { Input } from "@repo/ui/input";
import {
	Form,
	FormField,
	FormItem,
	FormLabel,
	FormControl,
	FormMessage,
} from "@repo/ui/form";
import { toast } from "@repo/ui/sonner";
import verifyEmailIllustration from "@repo/ui/assets/illustrations/auth/verify-email-illustration.svg";
import {
	forgotPasswordSchema,
	type ForgotPasswordValues,
} from "@/lib/validations/authValidations";
import { useForgotPassword } from "@/features/auth/hooks";

const RESEND_SECONDS = 45;

/**
 * Two states in one page, no separate route for the second: the request
 * form, then (once submitted) a "check your email" confirmation — mirrors
 * `VerifyCodeForm`'s resend-timer pattern, just for a link instead of a
 * code. No Figma reference for this page.
 */
function ForgotPasswordForm() {
	const form = useForm<ForgotPasswordValues>({
		resolver: zodResolver(forgotPasswordSchema),
		defaultValues: { email: "" },
	});
	const forgotPassword = useForgotPassword();
	const [sentTo, setSentTo] = useState<string | null>(null);
	const [secondsLeft, setSecondsLeft] = useState(RESEND_SECONDS);

	useEffect(() => {
		if (!sentTo || secondsLeft === 0) return;
		const timer = setInterval(() => setSecondsLeft((s) => s - 1), 1000);
		return () => clearInterval(timer);
	}, [sentTo, secondsLeft]);

	function onSubmit(values: ForgotPasswordValues) {
		forgotPassword.mutate(values, {
			onSuccess: () => {
				setSentTo(values.email);
				setSecondsLeft(RESEND_SECONDS);
			},
		});
	}

	function handleResend() {
		if (!sentTo) return;
		forgotPassword.mutate(
			{ email: sentTo },
			{ onSuccess: () => setSecondsLeft(RESEND_SECONDS) },
		);
		toast.info("Reset link sent again");
	}

	if (sentTo) {
		return (
			<div className="flex flex-col items-center gap-8 text-center">
				<Image src={verifyEmailIllustration} alt="" className="size-32" />

				<div className="flex flex-col gap-2">
					<h1 className="text-h4 text-foreground sm:text-h3">
						Check your email
					</h1>
					<p className="text-sm text-muted-foreground sm:text-b1">
						We&apos;ve sent a password reset link to{" "}
						<span className="font-semibold text-foreground">{sentTo}</span>
					</p>
				</div>

				<p className="text-b3 text-muted-foreground">
					Didn&apos;t get the email?{" "}
					{secondsLeft > 0 ? (
						`Resend in 00:${String(secondsLeft).padStart(2, "0")}`
					) : (
						<button
							type="button"
							onClick={handleResend}
							className="font-medium text-primary underline hover:no-underline"
						>
							Resend link
						</button>
					)}
				</p>

				<Link
					href="/auth/sign-in"
					className="text-b3 font-medium text-primary hover:underline"
				>
					Back to sign in
				</Link>
			</div>
		);
	}

	return (
		<div className="flex flex-col gap-8">
			<div className="flex flex-col gap-2">
				<h1 className="text-h4 text-foreground sm:text-h3">
					Forgot password?
				</h1>
				<p className="text-sm text-muted-foreground sm:text-b1">
					Enter your email and we&apos;ll send you a link to reset your
					password.
				</p>
			</div>

			<Form {...form}>
				<form
					noValidate
					onSubmit={form.handleSubmit(onSubmit)}
					className="flex flex-col gap-5"
				>
					<FormField
						control={form.control}
						name="email"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Email address</FormLabel>
								<FormControl>
									<Input
										type="email"
										autoComplete="email"
										placeholder="Enter your email address"
										{...field}
									/>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>

					<Button
						type="submit"
						size="large"
						className="w-full"
						loading={forgotPassword.isPending}
					>
						Send Reset Link
					</Button>
				</form>
			</Form>

			<p className="text-b3 text-muted-foreground text-center">
				Remembered your password?{" "}
				<Link
					href="/auth/sign-in"
					className="text-primary font-medium hover:underline"
				>
					Sign in
				</Link>
			</p>
		</div>
	);
}

export { ForgotPasswordForm };
