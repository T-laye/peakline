import type { Metadata } from "next";
import { LoginForm } from "@/features/auth/components/LoginForm";

export const metadata: Metadata = {
	title: "Sign In — Peakline Admin",
};

export default function LoginPage() {
	return (
		<div className="flex min-h-screen items-center justify-center bg-muted p-6">
			<LoginForm />
		</div>
	);
}
