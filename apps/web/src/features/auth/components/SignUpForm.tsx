"use client";

import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@repo/ui/button";
import { Input } from "@repo/ui/input";
import { PasswordInput } from "@repo/ui/password-input";
import { PhoneInput } from "@repo/ui/phone-input";
import { Checkbox } from "@repo/ui/checkbox";
import {
	Form,
	FormField,
	FormItem,
	FormLabel,
	FormControl,
	FormMessage,
} from "@repo/ui/form";
import {
	signUpSchema,
	type SignUpValues,
} from "@/lib/validations/authValidations";
import { useSignUp } from "@/features/auth/hooks";
import { PasswordRequirementsChecklist } from "@/features/auth/components/PasswordRequirementsChecklist";

/**
 * Account-creation step — name, email, phone, and password all collected
 * up front (per the mock; an earlier pass here left name fields for the
 * later Personal Details step, but the mock makes clear they belong on
 * this screen instead). Routes to email verification next, then Account
 * Type: Sign Up -> Verify -> Account Type -> ... -> Wallet Created.
 * `useSignUp` owns everything past a successful submit — storing the
 * fields into `signUpFlowStore`, toasting, and navigating — this component
 * only builds the form.
 */
function SignUpForm() {
	const form = useForm<SignUpValues>({
		resolver: zodResolver(signUpSchema),
		defaultValues: {
			firstName: "",
			lastName: "",
			otherName: "",
			email: "",
			phone: "",
			password: "",
			agreeToTerms: false,
		},
	});
	const signUp = useSignUp();
	const password = useWatch({ control: form.control, name: "password" });

	function onSubmit(values: SignUpValues) {
		signUp.mutate(values);
	}

	return (
		<div className="flex flex-col gap-8">
			<div className="flex flex-col gap-2">
				<h1 className="text-h4 sm:text-h3 text-foreground">
					Create your account
				</h1>
				<p className="text-sm sm:text-b1 text-muted-foreground sm:w-3/4">
					Join Peakline and start sending, receiving and paying securely.
				</p>
			</div>

			<Form {...form}>
				<form
					noValidate
					onSubmit={form.handleSubmit(onSubmit)}
					className="flex flex-col gap-5"
				>
					<div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
						<FormField
							control={form.control}
							name="firstName"
							render={({ field }) => (
								<FormItem>
									<FormLabel>First Name</FormLabel>
									<FormControl>
										<Input
											autoComplete="given-name"
											placeholder="Enter first name"
											{...field}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name="lastName"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Last Name</FormLabel>
									<FormControl>
										<Input
											autoComplete="family-name"
											placeholder="Enter last name"
											{...field}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name="otherName"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Other Name</FormLabel>
									<FormControl>
										<Input
											autoComplete="additional-name"
											placeholder="Enter other name"
											{...field}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
					</div>

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
						name="phone"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Phone Number</FormLabel>
								<FormControl>
									<PhoneInput
										name={field.name}
										value={field.value}
										onChange={field.onChange}
										onBlur={field.onBlur}
										placeholder="Enter your phone number"
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
										autoComplete="new-password"
										placeholder="Enter password"
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
						name="agreeToTerms"
						render={({ field }) => (
							<FormItem>
								<div className="flex items-start gap-3">
									<FormControl>
										<Checkbox
											checked={field.value}
											onCheckedChange={field.onChange}
											className="mt-0.5"
										/>
									</FormControl>
									<FormLabel className="block text-sm font-normal text-foreground">
										I agree to the{" "}
										<span className="font-medium text-primary">
											Terms of Service
										</span>{" "}
										and{" "}
										<span className="font-medium text-primary">
											Privacy Policy
										</span>
									</FormLabel>
								</div>
								<FormMessage />
							</FormItem>
						)}
					/>

					<Button
						type="submit"
						size="large"
						className="w-full"
						loading={signUp.isPending}
					>
						Create Account
					</Button>
				</form>
			</Form>
		</div>
	);
}

export { SignUpForm };
