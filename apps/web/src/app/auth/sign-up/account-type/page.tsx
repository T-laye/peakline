import type { Metadata } from "next";
import { AccountTypeForm } from "@/features/auth/components/AccountTypeForm";

export const metadata: Metadata = {
	title: "How will you use Peakline? — Peakline",
};

export default function AccountTypePage() {
	return <AccountTypeForm />;
}
