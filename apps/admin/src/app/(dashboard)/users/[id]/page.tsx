"use client";

import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@repo/ui/button";
import { UserDetail } from "@/features/users/components/UserDetail";

export default function UserDetailPage() {
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
					aria-label="Back to Users"
					onClick={() => router.push("/users")}
				>
					<ArrowLeft className="size-4" aria-hidden="true" />
				</Button>
				<h1 className="text-h4 text-foreground">User</h1>
			</div>
			<UserDetail id={params.id} />
		</div>
	);
}
