"use client";

import { useResendOtp, useVerifyOtp } from "@/features/auth/hooks";
import { useSignUpFlowStore } from "@/lib/stores/signUpFlowStore";
import { VerifyCodeForm } from "@/features/auth/components/VerifyCodeForm";

/**
 * Right after Sign Up, before Account Type: Sign Up -> Verify -> Account
 * Type -> [Merchant Setup, merchant only] -> Personal Details -> Wallet
 * Created. Verifies the email address from Sign Up, not the phone number
 * (Figma node 127:2709, "Verify your email" — the phone collected earlier
 * is for contact/SMS elsewhere, not this code). `useVerifyOtp` owns storing
 * the real tokens it gets back and navigating on success.
 */
function VerifyOtpForm() {
	const email = useSignUpFlowStore((state) => state.email) || "your email";
	const otpTtlSeconds = useSignUpFlowStore((state) => state.otpTtlSeconds);
	const verifyOtp = useVerifyOtp();
	const resendOtp = useResendOtp();

	return (
		<VerifyCodeForm
			method="email"
			destination={email}
			submitLabel="Verify email"
			isPending={verifyOtp.isPending}
			initialSeconds={otpTtlSeconds}
			onResend={async () => {
				const result = await resendOtp.mutateAsync(email);
				return result.data.ttlSeconds;
			}}
			onSubmit={(values) => verifyOtp.mutate({ ...values, email })}
		/>
	);
}

export { VerifyOtpForm };
