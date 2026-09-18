"use client";

import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@repo/ui/button";
import { TransactionDetail } from "@/features/transactions/components/TransactionDetail";

export default function TransactionDetailPage() {
	const params = useParams<{ id: string }>();
	const router = useRouter();

	return (
		<div className="flex flex-col gap-6">
			<div className="flex items-center gap-3">
				<Button
					type="button"
					variant="ghost"
					size="small"
					iconOnly
					aria-label="Back to Transactions"
					onClick={() => router.push("/transactions")}
				>
					<ArrowLeft className="size-4" aria-hidden="true" />
				</Button>
				<h1 className="text-h4 text-foreground">Transaction</h1>
			</div>
			<TransactionDetail id={params.id} />
		</div>
	);
}
