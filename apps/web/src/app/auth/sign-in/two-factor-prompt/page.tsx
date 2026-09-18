import type { Metadata } from "next";
import { TwoFactorSetupPromptForm } from "@/features/auth/components/TwoFactorSetupPromptForm";

export const metadata: Metadata = {
	title: "Secure your account — Peakline",
};

export default function TwoFactorSetupPromptPage() {
	return <TwoFactorSetupPromptForm />;
}
