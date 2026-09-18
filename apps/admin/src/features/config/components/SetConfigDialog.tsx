"use client";

import { useState } from "react";
import { Button } from "@repo/ui/button";
import { Input } from "@repo/ui/input";
import { Label } from "@repo/ui/label";
import { HelperText } from "@repo/ui/helper-text";
import { toast } from "@repo/ui/sonner";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogDescription,
	DialogFooter,
	DialogClose,
} from "@repo/ui/dialog";
import { useSetConfig } from "@/features/config/hooks";
import { getApiErrorMessage } from "@/lib/api/errorMessage";

interface SetConfigDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	/** `undefined` creates a new key (the key field is editable); a string
	 * edits that existing key (the key field is locked — `PUT` can't rename
	 * a key, only replace its value). The value field always starts empty
	 * even when editing — a decrypted secret is never pre-filled into a
	 * form; an admin who needs to see the current value first uses that
	 * row's own "Reveal" action instead. */
	existingKey?: string;
}

function SetConfigDialog({ open, onOpenChange, existingKey }: SetConfigDialogProps) {
	const [key, setKey] = useState(existingKey ?? "");
	const [value, setValue] = useState("");
	const [touched, setTouched] = useState(false);
	const setConfig = useSetConfig();
	const isEditing = !!existingKey;

	const keyMissing = touched && key.trim().length === 0;
	const valueMissing = touched && value.trim().length === 0;

	function handleOpenChange(next: boolean) {
		if (!next) {
			setKey(existingKey ?? "");
			setValue("");
			setTouched(false);
		}
		onOpenChange(next);
	}

	function handleSave() {
		if (key.trim().length === 0 || value.trim().length === 0) {
			setTouched(true);
			return;
		}
		setConfig.mutate(
			{ key: key.trim(), value },
			{
				onSuccess: () => {
					toast.success(isEditing ? "Config value updated" : "Config key created");
					handleOpenChange(false);
				},
				onError: (error) => toast.error(getApiErrorMessage(error, "Couldn't save config value")),
			},
		);
	}

	return (
		<Dialog open={open} onOpenChange={handleOpenChange}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>{isEditing ? `Update "${existingKey}"` : "Add a config key"}</DialogTitle>
					<DialogDescription>
						{isEditing
							? "Replaces this key's stored value — the previous value can't be recovered afterwards."
							: "Creates a new system config key with the value below, stored encrypted."}
					</DialogDescription>
				</DialogHeader>

				<div className="flex flex-col gap-1.5">
					<Label htmlFor="config-key">Key</Label>
					<Input
						id="config-key"
						value={key}
						onChange={(e) => setKey(e.target.value)}
						onBlur={() => setTouched(true)}
						disabled={isEditing}
						placeholder="e.g. stellar.horizon_url"
						aria-invalid={keyMissing}
					/>
					{keyMissing && <HelperText error>Enter a key</HelperText>}
				</div>

				<div className="flex flex-col gap-1.5">
					<Label htmlFor="config-value">Value</Label>
					<Input
						id="config-value"
						value={value}
						onChange={(e) => setValue(e.target.value)}
						onBlur={() => setTouched(true)}
						placeholder="New value"
						aria-invalid={valueMissing}
					/>
					{valueMissing && <HelperText error>Enter a value</HelperText>}
				</div>

				<DialogFooter className="sm:flex-row sm:justify-end">
					<DialogClose asChild>
						<Button type="button" variant="outline" className="w-full sm:w-auto">
							Cancel
						</Button>
					</DialogClose>
					<Button
						type="button"
						loading={setConfig.isPending}
						onClick={handleSave}
						className="w-full sm:w-auto"
					>
						Save
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

export { SetConfigDialog };
