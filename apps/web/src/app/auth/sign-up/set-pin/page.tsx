import type { Metadata } from "next";
import { SetPinForm } from "@/features/auth/components/SetPinForm";

export const metadata: Metadata = {
	title: "Set up your transaction PIN — Peakline",
};

export default function SetPinPage() {
	return <SetPinForm />;
}
