import type { Metadata } from "next";
import { TransactionsPageContent } from "@/features/merchant/components/TransactionsPageContent";

export const metadata: Metadata = {
	title: "Transactions — Peakline",
};

export default function TransactionsPage() {
	return <TransactionsPageContent />;
}
