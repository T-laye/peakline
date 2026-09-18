"use client";

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
import { signInSchema, type SignInValues } from "@/lib/validations/authValidations";
import { useSignIn } from "@/features/auth/hooks";

/**
 * Staff sign-in — same `/auth/login` every customer account uses (there's
 * no separate admin login endpoint; see `useStaffGate`'s own note on how
 * this app tells the two apart afterwards). Deliberately plain — no
 * marketing illustration, no "create an account" link — this console has
 * no self-serve sign-up.
 */
function LoginForm() {
	const signIn = useSignIn();
	const form = useForm<SignInValues>({
		resolver: zodResolver(signInSchema),
		defaultValues: { email: "", password: "" },
	});

	function onSubmit(values: SignInValues) {
		signIn.mutate(values);
	}

	return (
		<div className="flex w-full max-w-sm flex-col gap-8">
			<div className="flex flex-col gap-1.5">
				<h1 className="text-h4 text-foreground">Peakline Admin</h1>
				<p className="text-b3 text-muted-foreground">
					Sign in with your staff account to continue.
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
								<FormLabel>Email</FormLabel>
								<FormControl>
									<Input
										type="email"
										autoComplete="username"
										placeholder="you@peakline.com"
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
									<PasswordInput autoComplete="current-password" {...field} />
								</FormControl>
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
						Sign In
					</Button>
				</form>
			</Form>
		</div>
	);
}

export { LoginForm };
