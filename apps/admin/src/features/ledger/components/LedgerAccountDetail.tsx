"use client";

import { Skeleton } from "@repo/ui/skeleton";
import { DynamicRecord } from "@/components/data/DynamicRecord";
import { useLedgerAccount } from "@/features/ledger/hooks";
import { getApiErrorMessage } from "@/lib/api/errorMessage";

function LedgerAccountDetail({ id }: { id: string }) {
	const { data: account, isLoading, isError, error } = useLedgerAccount(id);

	if (isLoading) return <Skeleton className="h-80 w-full rounded-2xl" />;

	return (
		<DynamicRecord
			title="Ledger Account"
			record={isError ? null : account}
			notFoundTitle="Ledger account not found"
			notFoundDescription={getApiErrorMessage(error, "It may have been removed, or the id is wrong.")}
		/>
	);
}

export { LedgerAccountDetail };
