import type { Metadata } from "next";
import { VerifyOtpForm } from "@/features/auth/components/VerifyOtpForm";

export const metadata: Metadata = {
	title: "Verify your email — Peakline",
};

export default function VerifyOtpPage() {
	return <VerifyOtpForm />;
}
