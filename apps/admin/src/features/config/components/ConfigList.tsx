"use client";

import { useState } from "react";
import { Plus, Settings } from "lucide-react";
import { Skeleton } from "@repo/ui/skeleton";
import { Button } from "@repo/ui/button";
import { EmptyState } from "@repo/ui/empty-state";
import { toast } from "@repo/ui/sonner";
import { ConfirmActionDialog } from "@/components/data/ConfirmActionDialog";
import { ConfigKeyRow } from "@/features/config/components/ConfigKeyRow";
import { SetConfigDialog } from "@/features/config/components/SetConfigDialog";
import { useAdminConfigKeys, useDeleteConfig } from "@/features/config/hooks";
import { getApiErrorMessage } from "@/lib/api/errorMessage";

function ListSkeleton() {
	return (
		<div className="flex flex-col gap-3">
			<Skeleton className="h-20 w-full rounded-xl" />
			<Skeleton className="h-20 w-full rounded-xl" />
			<Skeleton className="h-20 w-full rounded-xl" />
		</div>
	);
}

function ConfigList() {
	const { data: keys, isLoading, isError } = useAdminConfigKeys();
	const deleteConfig = useDeleteConfig();

	const [createOpen, setCreateOpen] = useState(false);
	const [editingKey, setEditingKey] = useState<string | null>(null);
	const [deletingKey, setDeletingKey] = useState<string | null>(null);

	return (
		<div className="flex flex-col gap-4">
			<div className="flex justify-end">
				<Button type="button" onClick={() => setCreateOpen(true)}>
					<Plus className="size-4" aria-hidden="true" />
					Add config key
				</Button>
			</div>

			{isLoading ? (
				<ListSkeleton />
			) : isError ? (
				<div className="rounded-2xl border border-border bg-background">
					<EmptyState
						icon={Settings}
						title="Couldn't load config"
						description="Something went wrong. Try refreshing."
					/>
				</div>
			) : !keys || keys.length === 0 ? (
				<div className="rounded-2xl border border-border bg-background">
					<EmptyState
						icon={Settings}
						title="No config keys yet"
						description="Add one to get started."
					/>
				</div>
			) : (
				<div className="flex flex-col gap-3">
					{keys.map((item) => (
						<ConfigKeyRow
							key={item.key}
							item={item}
							onEdit={() => setEditingKey(item.key)}
							onDelete={() => setDeletingKey(item.key)}
						/>
					))}
				</div>
			)}

			<SetConfigDialog open={createOpen} onOpenChange={setCreateOpen} />

			<SetConfigDialog
				open={editingKey !== null}
				onOpenChange={(open) => !open && setEditingKey(null)}
				existingKey={editingKey ?? undefined}
			/>

			<ConfirmActionDialog
				open={deletingKey !== null}
				onOpenChange={(open) => !open && setDeletingKey(null)}
				title="Delete this config key"
				description={
					deletingKey
						? `"${deletingKey}" will be permanently removed. Anything reading it will fall back to its own default, if it has one.`
						: ""
				}
				confirmLabel="Delete key"
				destructive
				reason="hidden"
				isPending={deleteConfig.isPending}
				onConfirm={() => {
					if (!deletingKey) return;
					deleteConfig.mutate(deletingKey, {
						onSuccess: () => {
							toast.success("Config key deleted");
							setDeletingKey(null);
						},
						onError: (error) => toast.error(getApiErrorMessage(error, "Couldn't delete config key")),
					});
				}}
			/>
		</div>
	);
}

export { ConfigList };
