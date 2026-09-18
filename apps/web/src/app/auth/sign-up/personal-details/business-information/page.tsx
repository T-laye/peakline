import type { Metadata } from "next";
import { BusinessInformationForm } from "@/features/auth/components/BusinessInformationForm";

export const metadata: Metadata = {
	title: "Business information — Peakline",
};

export default function BusinessInformationPage() {
	return <BusinessInformationForm />;
}
