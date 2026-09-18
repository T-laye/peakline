import type { Metadata } from "next";
import { PersonalDetailsForm } from "@/features/auth/components/PersonalDetailsForm";

export const metadata: Metadata = {
	title: "Tell us about yourself — Peakline",
};

export default function PersonalDetailsPage() {
	return <PersonalDetailsForm />;
}
