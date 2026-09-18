"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ShieldCheck } from "lucide-react";
import { Button } from "@repo/ui/button";
import { OtpInput } from "@repo/ui/otp-input";
import { Form, FormField, FormItem, FormControl, FormMessage } from "@repo/ui/form";
import { verifyMfaSchema, type VerifyMfaValues } from "@/lib/validations/authValidations";
import { useVerifyMfa } from "@/features/auth/hooks";
import { useLoginFlowStore } from "@/lib/stores/loginFlowStore";

/** Second step of login for a staff account with 2FA enabled — the same
 * authenticator-app TOTP code apps/web's own account settings enrolls,
 * exchanged (with the `mfaToken` login just returned) for real tokens via
 * `POST /auth/2fa/verify`. */
function MfaVerifyForm() {
	const router = useRouter();
	const mfaToken = useLoginFlowStore((state) => state.mfaToken);
	const verifyMfa = useVerifyMfa();
	const form = useForm<VerifyMfaValues>({
		resolver: zodResolver(verifyMfaSchema),
		defaultValues: { totpCode: "" },
	});

	// No pending MFA token to verify (e.g. a direct visit, or a refresh after
	// the flow already completed) — nothing to do here.
	useEffect(() => {
		if (!mfaToken) router.replace("/login");
	}, [mfaToken, router]);

	if (!mfaToken) return null;

	function onSubmit(values: VerifyMfaValues) {
		verifyMfa.mutate(values);
	}

	return (
		<div className="flex w-full max-w-sm flex-col items-center gap-8 text-center">
			<span className="flex size-16 items-center justify-center rounded-full bg-primary-500/10">
				<ShieldCheck className="size-7 text-primary-500" aria-hidden="true" />
			</span>

			<div className="flex flex-col gap-1.5">
				<h1 className="text-h4 text-foreground">Two-factor verification</h1>
				<p className="text-b3 text-muted-foreground">
					Enter the 6-digit code from your authenticator app.
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
						name="totpCode"
						render={({ field }) => (
							<FormItem className="w-full">
								<FormControl>
									<OtpInput value={field.value} onChange={field.onChange} />
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>

					<Button
						type="submit"
						size="large"
						className="w-full"
						loading={verifyMfa.isPending}
					>
						Verify
					</Button>
				</form>
			</Form>
		</div>
	);
}

export { MfaVerifyForm };
