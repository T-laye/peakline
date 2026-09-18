import type { Metadata } from "next";
import { ReviewForm } from "@/features/auth/components/ReviewForm";

export const metadata: Metadata = {
	title: "Review your details — Peakline",
};

export default function ReviewPage() {
	return <ReviewForm />;
}
