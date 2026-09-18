import type { Metadata } from "next";
import { LoginVerifyForm } from "@/features/auth/components/LoginVerifyForm";

export const metadata: Metadata = {
	title: "Verify your identity — Peakline",
};

export default function LoginVerifyPage() {
	return <LoginVerifyForm />;
}
