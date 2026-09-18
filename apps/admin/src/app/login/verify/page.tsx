import type { Metadata } from "next";
import { MfaVerifyForm } from "@/features/auth/components/MfaVerifyForm";

export const metadata: Metadata = {
	title: "Verify — Peakline Admin",
};

export default function LoginVerifyPage() {
	return (
		<div className="flex min-h-screen items-center justify-center bg-muted p-6">
			<MfaVerifyForm />
		</div>
	);
}
