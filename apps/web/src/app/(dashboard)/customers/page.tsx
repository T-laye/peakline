import type { Metadata } from "next";
import { PageHeader } from "@/components/layouts/PageHeader";
import { CustomersList } from "@/features/customers/components/CustomersList";

export const metadata: Metadata = {
	title: "Customers — Peakline",
};

export default function CustomersPage() {
	return (
		<div className="flex flex-col gap-6 sm:gap-8">
			<PageHeader title="Customers" subtitle="Everyone you've requested a payment from." />
			<CustomersList />
		</div>
	);
}
