"use client";

import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@repo/ui/button";
import { LedgerAccountDetail } from "@/features/ledger/components/LedgerAccountDetail";

export default function LedgerAccountDetailPage() {
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
					aria-label="Back to Ledger"
					onClick={() => router.push("/ledger")}
				>
					<ArrowLeft className="size-4" aria-hidden="true" />
				</Button>
				<h1 className="text-h4 text-foreground">Ledger Account</h1>
			</div>
			<LedgerAccountDetail id={params.id} />
		</div>
	);
}
