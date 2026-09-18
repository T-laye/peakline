import type { Metadata } from "next";
import { SignUpForm } from "@/features/auth/components/SignUpForm";

export const metadata: Metadata = {
	title: "Sign up — Peakline",
};

export default function SignUpPage() {
	return <SignUpForm />;
}
