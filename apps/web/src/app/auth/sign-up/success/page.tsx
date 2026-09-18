import type { Metadata } from "next";
import { SuccessForm } from "@/features/auth/components/SuccessForm";

export const metadata: Metadata = {
	title: "Wallet created — Peakline",
};

export default function SuccessPage() {
	return <SuccessForm />;
}
