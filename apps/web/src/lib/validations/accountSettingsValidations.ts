import { z } from "zod";
import { PASSWORD_RULES } from "@/lib/validations/authValidations";

/** Step 1 of Change Transaction PIN — `PATCH /users/pin` itself only wants
 * `oldPin`/`newPin` (it doesn't apply the change yet; see
 * `ChangePinDialog`'s own note on the OTP/2FA step the mock doesn't show
 * but the real endpoint requires before this actually takes effect). */
export const changePinSchema = z
	.object({
		oldPin: z.string().regex(/^\d{6}$/, "Enter your current 6-digit PIN"),
		newPin: z.string().regex(/^\d{6}$/, "Enter a new 6-digit PIN"),
	})
	.refine((data) => data.oldPin !== data.newPin, {
		message: "New PIN must be different from your current one",
		path: ["newPin"],
	});
export type ChangePinValues = z.infer<typeof changePinSchema>;

/** `POST /auth/change-password` — real (confirmed live). Field names here
 * match the mock's own labels; mapped to the endpoint's actual
 * `currentPassword`/`newPassword` body at the call site
 * (`useChangePassword`). */
export const changePasswordSchema = z.object({
	oldPassword: z.string().min(1, "Enter your current password"),
	newPassword: z
		.string()
		.min(1, "Enter a new password")
		.refine(
			(value) => PASSWORD_RULES.every((rule) => rule.test(value)),
			"Your new password doesn't meet all the requirements",
		),
});
export type ChangePasswordValues = z.infer<typeof changePasswordSchema>;
