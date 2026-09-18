"use client";

import { Landmark } from "lucide-react";
import { Skeleton } from "@repo/ui/skeleton";
import { DynamicTable } from "@/components/data/DynamicTable";
import { useSystemAccounts } from "@/features/ledger/hooks";

function SystemAccountsSection() {
	const { data: accounts, isLoading } = useSystemAccounts();

	if (isLoading) return <Skeleton className="h-72 w-full rounded-xl" />;

	return (
		<DynamicTable
			rows={accounts ?? []}
			emptyIcon={Landmark}
			emptyTitle="No system accounts found"
			emptyDescription="Nothing came back for the platform's own float accounts."
		/>
	);
}

export { SystemAccountsSection };
