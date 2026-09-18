"use client";

import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@repo/ui/button";
import { BusinessDetail } from "@/features/businesses/components/BusinessDetail";

export default function BusinessDetailPage() {
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
					aria-label="Back to Businesses"
					onClick={() => router.push("/businesses")}
				>
					<ArrowLeft className="size-4" aria-hidden="true" />
				</Button>
				<h1 className="text-h4 text-foreground">Business</h1>
			</div>
			<BusinessDetail id={params.id} />
		</div>
	);
}
