"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@repo/ui/button";
import { PasswordInput } from "@repo/ui/password-input";
import {
	Form,
	FormField,
	FormItem,
	FormLabel,
	FormControl,
	FormMessage,
} from "@repo/ui/form";
import { toast } from "@repo/ui/sonner";
import {
	resetPasswordSchema,
	type ResetPasswordValues,
} from "@/lib/validations/authValidations";
import { useResetPassword } from "@/features/auth/hooks";
import { PasswordRequirementsChecklist } from "@/features/auth/components/PasswordRequirementsChecklist";

/**
 * Reached from the link in the Forgot Password email — a real one would
 * carry a one-time token as a query param; there's no backend to validate
 * it against yet, so it's just read through and passed along. Confirm
 * Password is deliberately kept here (unlike Sign Up, whose Figma dropped
 * it) since there's no reference design saying otherwise and it's the
 * expected pattern for a reset specifically.
 */
function ResetPasswordForm() {
	const router = useRouter();
	const token = useSearchParams().get("token");
	const form = useForm<ResetPasswordValues>({
		resolver: zodResolver(resetPasswordSchema),
		defaultValues: { password: "", confirmPassword: "" },
	});
	const resetPassword = useResetPassword();
	const password = useWatch({ control: form.control, name: "password" });

	function onSubmit(values: ResetPasswordValues) {
		resetPassword.mutate(
			{ ...values, token },
			{
				onSuccess: () => {
					toast.success("Password reset — sign in with your new password");
					router.push("/auth/sign-in");
				},
			},
		);
	}

	return (
		<div className="flex flex-col gap-8">
			<div className="flex flex-col gap-2">
				<h1 className="text-h4 text-foreground sm:text-h3">Reset password</h1>
				<p className="text-sm text-muted-foreground sm:text-b1">
					Choose a new password for your account.
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
						name="password"
						render={({ field }) => (
							<FormItem>
								<FormLabel>New password</FormLabel>
								<FormControl>
									<PasswordInput
										autoComplete="new-password"
										placeholder="Enter new password"
										{...field}
									/>
								</FormControl>
								<PasswordRequirementsChecklist password={password} />
								<FormMessage />
							</FormItem>
						)}
					/>

					<FormField
						control={form.control}
						name="confirmPassword"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Confirm new password</FormLabel>
								<FormControl>
									<PasswordInput
										autoComplete="new-password"
										placeholder="Re-enter new password"
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
						loading={resetPassword.isPending}
					>
						Reset Password
					</Button>
				</form>
			</Form>
		</div>
	);
}

export { ResetPasswordForm };
