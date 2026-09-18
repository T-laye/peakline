"use client";

import { Check } from "lucide-react";
import { cn } from "@repo/ui/lib/utils";
import { PASSWORD_RULES } from "@/lib/validations/authValidations";

/** Live checklist for `PASSWORD_RULES` — shared by Sign Up and Reset
 * Password rather than a single cryptic "doesn't meet requirements" error. */
function PasswordRequirementsChecklist({ password }: { password: string }) {
	return (
		<ul className="grid grid-cols-1 gap-x-4 gap-y-1 sm:grid-cols-2">
			{PASSWORD_RULES.map((rule) => {
				const met = rule.test(password);
				return (
					<li
						key={rule.key}
						className={cn(
							"flex items-center gap-1.5 text-c1",
							met ? "text-success" : "text-muted-foreground",
						)}
					>
						{met ? (
							<Check className="size-3.5 shrink-0" aria-hidden="true" />
						) : (
							<span
								className="size-3.5 shrink-0 rounded-full border border-current"
								aria-hidden="true"
							/>
						)}
						{rule.label}
					</li>
				);
			})}
		</ul>
	);
}

export { PasswordRequirementsChecklist };
