import type { Metadata } from "next";
import { Suspense } from "react";
import { ResetPasswordForm } from "@/features/auth/components/ResetPasswordForm";

export const metadata: Metadata = {
	title: "Reset password — Peakline",
};

export default function ResetPasswordPage() {
	// ResetPasswordForm reads the reset token via useSearchParams(), which
	// Next.js requires a Suspense boundary for on an otherwise-static page.
	return (
		<Suspense>
			<ResetPasswordForm />
		</Suspense>
	);
}
