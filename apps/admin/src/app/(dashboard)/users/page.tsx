import type { Metadata } from "next";
import { UsersList } from "@/features/users/components/UsersList";

export const metadata: Metadata = { title: "Users — Peakline Admin" };

export default function UsersPage() {
	return (
		<div className="flex flex-col gap-6">
			<div className="flex flex-col gap-1">
				<h1 className="text-h4 text-foreground">Users</h1>
				<p className="text-b3 text-muted-foreground">Every account on the platform.</p>
			</div>
			<UsersList />
		</div>
	);
}
