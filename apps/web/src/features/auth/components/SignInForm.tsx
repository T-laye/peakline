"use client";

import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@repo/ui/button";
import { Input } from "@repo/ui/input";
import { PasswordInput } from "@repo/ui/password-input";
import {
	Form,
	FormField,
	FormItem,
	FormLabel,
	FormControl,
	FormMessage,
} from "@repo/ui/form";
import {
	signInSchema,
	type SignInValues,
} from "@/lib/validations/authValidations";
import { useSignIn } from "@/features/auth/hooks";

/**
 * Figma node 127:4272, confirmed via screenshot. 2FA is optional, not
 * mandatory on every login: once an account has gone through it, further
 * logins skip straight to the dashboard — it's a one-time account
 * verification badge in this demo, not a per-login gate. An account that
 * hasn't gone through it yet gets a one-time, skippable prompt instead
 * (see `TwoFactorSetupPromptForm`):
 *   Sign In -> Dashboard, if 2FA is already done, or
 *   Sign In -> Set-up prompt -> Dashboard (Skip) or the 2FA method-picker
 *   + verify sequence (Continue), if not.
 * `useSignIn` owns storing the real tokens it gets back and deciding which
 * of those two routes to take.
 */
function SignInForm() {
	const form = useForm<SignInValues>({
		resolver: zodResolver(signInSchema),
		defaultValues: { email: "", password: "" },
	});
	const signIn = useSignIn();

	function onSubmit(values: SignInValues) {
		signIn.mutate(values);
	}

	return (
		<div className="flex flex-col gap-8">
			<div className="flex flex-col gap-2">
				<h1 className="text-h4 sm:text-h3 text-foreground">
					Welcome Back!
				</h1>
				<p className="text-sm sm:text-b1 text-muted-foreground">
					Login to your Peakline account to start sending, receiving and
					paying securely.
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
								<FormLabel>Email Address</FormLabel>
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

					<FormField
						control={form.control}
						name="password"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Password</FormLabel>
								<FormControl>
									<PasswordInput
										autoComplete="current-password"
										placeholder="Enter password"
										{...field}
									/>
								</FormControl>
								<div className="flex justify-end">
									<Link
										href="/auth/forgot-password"
										className="text-c1 text-primary hover:underline"
									>
										Forgot Password?
									</Link>
								</div>
								<FormMessage />
							</FormItem>
						)}
					/>

					<Button
						type="submit"
						size="large"
						className="w-full"
						loading={signIn.isPending}
					>
						Log in
					</Button>
				</form>
			</Form>
		</div>
	);
}

export { SignInForm };
